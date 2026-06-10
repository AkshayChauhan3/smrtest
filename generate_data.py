import pandas as pd
import numpy as np
import os

# Ensure reproducibility
np.random.seed(42)

def generate_smartrail_dataset():
    # 1. Base grid generation (365 days of 2025)
    dates = pd.date_range(start="2025-01-01 00:00:00", end="2025-12-31 23:00:00", freq="h")
    stations = ["Vadodara", "Ahmedabad", "Surat", "Mumbai Central", "Anand", "Nadiad", "Bharuch", "Vapi", "Rajkot", "Gandhinagar"]
    coaches = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"]

    print("Generating base index combinations...")
    index = pd.MultiIndex.from_product([dates, stations, coaches], names=["Timestamp", "Station", "Coach"])
    df = pd.DataFrame(index=index).reset_index()
    print(f"Base dataframe created with {len(df):,} rows.")

    # 2. Extract timestamp properties
    hours = df["Timestamp"].dt.hour.values
    months = df["Timestamp"].dt.month.values
    day_of_week = df["Timestamp"].dt.dayofweek.values
    
    # 3. Station indexes and popularity
    station_to_idx = {s: i for i, s in enumerate(stations)}
    station_indices = df["Station"].map(station_to_idx).values
    
    popularity_mapping = {
        "Mumbai Central": "Highest",
        "Ahmedabad": "High",
        "Surat": "High",
        "Vadodara": "High",
        "Anand": "Medium",
        "Nadiad": "Medium",
        "Bharuch": "Medium",
        "Vapi": "Medium",
        "Rajkot": "Medium",
        "Gandhinagar": "Medium"
    }
    popularity_scores = {
        "Mumbai Central": 0.95,
        "Ahmedabad": 0.85,
        "Surat": 0.80,
        "Vadodara": 0.75,
        "Anand": 0.55,
        "Nadiad": 0.50,
        "Bharuch": 0.50,
        "Vapi": 0.55,
        "Rajkot": 0.60,
        "Gandhinagar": 0.55
    }
    df["Station_Popularity"] = df["Station"].map(popularity_mapping)
    pop_scores = df["Station"].map(popularity_scores).values

    # 4. Train_ID generation (deterministic mapping per hour and station)
    trains = [
        "TR-12901", "TR-12009", "TR-20901", "TR-12925", "TR-12951",
        "TR-19015", "TR-22953", "TR-12933", "TR-19217", "TR-22961"
    ]
    hours_since_start = ((df["Timestamp"] - dates[0]).dt.total_seconds() // 3600).astype(int)
    train_idx = (hours_since_start + station_indices) % len(trains)
    df["Train_ID"] = np.array(trains)[train_idx]

    # 5. Platform Number (realistic constraints)
    platform_limits = {
        "Mumbai Central": 8,
        "Ahmedabad": 6,
        "Surat": 4,
        "Vadodara": 4,
        "Anand": 3,
        "Nadiad": 3,
        "Bharuch": 3,
        "Vapi": 3,
        "Rajkot": 4,
        "Gandhinagar": 3
    }
    platform_max = df["Station"].map(platform_limits).values
    df["Platform_Number"] = ((station_indices * 3 + train_idx) % platform_max + 1).astype(int)

    # 6. Capacity
    df["Capacity"] = 80

    # 7. Day Type
    df["Day_Type"] = np.where(day_of_week >= 5, "Weekend", "Weekday")
    is_weekend = (df["Day_Type"] == "Weekend").values

    # 8. Festival Logic
    festival_mapping = {
        "2025-03-14": "Holi",
        "2025-08-15": "Independence Day",
        "2025-10-02": "Gandhi Jayanti",
        "2025-10-20": "Diwali",
        "2025-12-25": "Christmas"
    }
    df["Festival"] = df["Timestamp"].dt.strftime("%Y-%m-%d").map(festival_mapping).fillna("None")
    is_festival = (df["Festival"] != "None").values

    # 9. Weather Logic (Monsoon seasonal probability)
    print("Simulating weather and temperature...")
    weather_rand = np.random.rand(len(df))
    weather = np.empty(len(df), dtype=object)
    monsoon_mask = (months >= 6) & (months <= 9)
    
    # Monsoon: Rainy 65%, Cloudy 25%, Sunny 10%
    weather[monsoon_mask] = np.select(
        [weather_rand[monsoon_mask] < 0.65, weather_rand[monsoon_mask] < 0.90],
        ["Rainy", "Cloudy"],
        default="Sunny"
    )
    # Non-monsoon: Sunny 75%, Cloudy 20%, Rainy 5%
    weather[~monsoon_mask] = np.select(
        [weather_rand[~monsoon_mask] < 0.75, weather_rand[~monsoon_mask] < 0.95],
        ["Sunny", "Cloudy"],
        default="Rainy"
    )
    df["Weather"] = weather

    # 10. Temperature Logic
    temp_base = np.select(
        [(months >= 3) & (months <= 5), (months >= 6) & (months <= 9)],
        [35.0, 29.0],  # Summer, Monsoon
        default=22.0   # Winter
    )
    # Hourly temp wave (peak 14h, min 5h)
    hourly_var = 7.0 * np.sin((hours - 8) * np.pi / 12)
    temp_noise = np.random.normal(0, 1.5, size=len(df))
    temperature = temp_base + hourly_var + temp_noise
    # Cool down during rains
    temperature = np.where(df["Weather"] == "Rainy", temperature - 3.0, temperature)
    df["Temperature"] = np.round(temperature, 1)

    # 11. Delay Minutes
    print("Calculating delay minutes...")
    base_delay = np.random.exponential(scale=3.0, size=len(df)).astype(int)
    base_delay = np.clip(base_delay, 0, 15)
    rainy_addon = np.where(df["Weather"] == "Rainy", np.random.randint(15, 45, size=len(df)), 0)
    festival_addon = np.where(is_festival, np.random.randint(5, 20, size=len(df)), 0)
    df["Delay_Minutes"] = base_delay + rainy_addon + festival_addon

    # 12. Occupancy Logic
    print("Generating passenger occupancy patterns...")
    hour_min_pct = np.zeros(24)
    hour_max_pct = np.zeros(24)
    
    # Morning Rush (07:00–10:00)
    hour_min_pct[7:11] = 0.70
    hour_max_pct[7:11] = 1.00
    # Afternoon (11:00–16:00)
    hour_min_pct[11:17] = 0.30
    hour_max_pct[11:17] = 0.60
    # Evening Rush (17:00–21:00)
    hour_min_pct[17:22] = 0.75
    hour_max_pct[17:22] = 1.00
    # Late Night (22:00–05:00)
    hour_min_pct[[22, 23, 0, 1, 2, 3, 4, 5]] = 0.10
    hour_max_pct[[22, 23, 0, 1, 2, 3, 4, 5]] = 0.40
    # Transition hour 6:00
    hour_min_pct[6] = 0.25
    hour_max_pct[6] = 0.50

    base_min = hour_min_pct[hours]
    base_max = hour_max_pct[hours]

    # Weekend adjustments
    is_rush = ((hours >= 7) & (hours <= 10)) | ((hours >= 17) & (hours <= 21))
    weekend_min = np.where(is_weekend, base_min * 0.75, base_min)
    weekend_max = np.where(is_weekend, base_max * 0.75, base_max)
    # Bumps for leisure hours on weekends
    weekend_min = np.where(is_weekend & ~is_rush, weekend_min * 1.15, weekend_min)
    weekend_max = np.where(is_weekend & ~is_rush, weekend_max * 1.15, weekend_max)

    # Station Popularity adjustment
    pop_factor = 0.7 + 0.3 * pop_scores
    pop_min = weekend_min * pop_factor
    pop_max = weekend_max * pop_factor

    # Festival adjustments
    festival_mult = np.where(is_festival, np.random.uniform(1.2, 1.4, size=len(df)), 1.0)
    final_min = pop_min * festival_mult
    final_max = pop_max * festival_mult

    # Clip to physical limits
    final_min = np.clip(final_min, 0.05, 0.95)
    final_max = np.clip(final_max, 0.10, 1.00)

    # Generate occupancy percentage
    occupancy_pct = np.random.uniform(final_min, final_max)

    # Coach-level adjustments (middle coaches are typically more crowded)
    coach_multipliers = {
        "C1": 0.85, "C2": 0.90, "C3": 1.05, "C4": 1.10,
        "C5": 1.10, "C6": 1.05, "C7": 0.95, "C8": 0.80
    }
    coach_mult = df["Coach"].map(coach_multipliers).values
    occupancy_pct = occupancy_pct * coach_mult
    occupancy_pct = np.clip(occupancy_pct, 0.05, 1.00)

    df["Occupancy"] = np.round(occupancy_pct * df["Capacity"]).astype(int)

    # Boarding and deboarding passenger exchanges
    deboard_fraction = np.random.uniform(0.10, 0.40, size=len(df)) * (0.8 + 0.4 * pop_scores)
    deboard_fraction = np.clip(deboard_fraction, 0.05, 0.80)
    df["Deboarding"] = np.round(df["Occupancy"] * deboard_fraction).astype(int)

    board_fraction = np.random.uniform(0.15, 0.45, size=len(df)) * (0.8 + 0.4 * pop_scores)
    board_fraction = np.clip(board_fraction, 0.05, 0.80)
    df["Boarding"] = np.round(df["Occupancy"] * board_fraction).astype(int)

    # Cleanups
    df["Boarding"] = np.maximum(df["Boarding"], np.random.randint(1, 4, size=len(df)))
    df["Deboarding"] = np.minimum(df["Deboarding"], df["Occupancy"])
    df["Deboarding"] = np.maximum(df["Deboarding"], np.random.randint(1, 3, size=len(df)))
    df["Deboarding"] = np.minimum(df["Deboarding"], df["Occupancy"])

    # 13. Anomaly Injection (~1% of data)
    print("Injecting anomalies (1% target)...")
    df["Anomaly_Flag"] = 0
    anomaly_indices = np.random.choice(df.index, size=int(len(df) * 0.01), replace=False)
    df.loc[anomaly_indices, "Anomaly_Flag"] = 1

    num_anomalies = len(anomaly_indices)
    type_size = num_anomalies // 4
    idx_surge = anomaly_indices[:type_size]
    idx_overcrowd = anomaly_indices[type_size:2*type_size]
    idx_door_malfunction = anomaly_indices[2*type_size:3*type_size]
    idx_crowd_spike = anomaly_indices[3*type_size:]

    # Type 1: Sudden passenger surge (occupancy exceeds capacity)
    df.loc[idx_surge, "Occupancy"] = np.random.randint(84, 100, size=len(idx_surge))
    df.loc[idx_surge, "Boarding"] = np.random.randint(40, 60, size=len(idx_surge))
    df.loc[idx_surge, "Delay_Minutes"] += np.random.randint(10, 30, size=len(idx_surge))

    # Type 2: Unusual overcrowding
    df.loc[idx_overcrowd, "Occupancy"] = np.random.randint(75, 80, size=len(idx_overcrowd))
    df.loc[idx_overcrowd, "Boarding"] = np.random.randint(30, 45, size=len(idx_overcrowd))

    # Type 3: Door malfunction simulation
    df.loc[idx_door_malfunction, "Delay_Minutes"] = np.random.randint(90, 180, size=len(idx_door_malfunction))
    df.loc[idx_door_malfunction, "Deboarding"] = np.random.randint(0, 3, size=len(idx_door_malfunction))
    df.loc[idx_door_malfunction, "Boarding"] = np.random.randint(0, 3, size=len(idx_door_malfunction))

    # Type 4: Unexpected crowd spike at night
    df.loc[idx_crowd_spike, "Occupancy"] = np.random.randint(65, 80, size=len(idx_crowd_spike))
    df.loc[idx_crowd_spike, "Boarding"] = np.random.randint(25, 40, size=len(idx_crowd_spike))

    # Recalculate percentages post-anomaly
    df["Occupancy_Percentage"] = np.round((df["Occupancy"] / df["Capacity"]) * 100, 2)
    df["Passenger_Density_Score"] = np.round((df["Occupancy"] / df["Capacity"]) * 100, 2)

    # 14. Crowd Level Classification
    pct_vals = df["Occupancy_Percentage"].values
    df["Crowd_Level"] = np.select(
        [pct_vals <= 40.0, pct_vals <= 70.0, pct_vals <= 90.0],
        ["Low", "Medium", "High"],
        default="Critical"
    )

    # 15. Predicted Next Stop Occupancy
    print("Simulating next stop prediction...")
    current_occ = df["Occupancy"].values
    change = np.random.normal(loc=0.0, scale=8.0, size=len(df))
    change = np.where(current_occ > 60, change - 10.0, change)
    change = np.where((current_occ < 40) & is_rush, change + 12.0, change)
    change = np.where(pop_scores > 0.75, change + 5.0, change - 3.0)
    next_occ = np.round(current_occ + change).astype(int)
    max_allowed = np.where(df["Anomaly_Flag"] == 1, 100, 80)
    df["Predicted_Next_Stop_Occupancy"] = np.clip(next_occ, 0, max_allowed)

    # 16. Coach Heatmap Index
    coach_offsets = {
        "C1": -0.06, "C2": -0.02, "C3": 0.02, "C4": 0.05,
        "C5": 0.05, "C6": 0.02, "C7": -0.02, "C8": -0.06
    }
    offsets = df["Coach"].map(coach_offsets).values
    noise = np.random.normal(0, 0.04, size=len(df))
    heatmap_idx = (df["Occupancy_Percentage"] / 100.0) + offsets + noise
    df["Coach_Heatmap_Index"] = np.round(np.clip(heatmap_idx, 0.0, 1.0), 3)

    # Reorder columns as requested
    required_cols = [
        "Timestamp", "Train_ID", "Station", "Platform_Number", "Coach",
        "Boarding", "Deboarding", "Occupancy", "Capacity", "Occupancy_Percentage",
        "Weather", "Temperature", "Day_Type", "Festival", "Delay_Minutes",
        "Crowd_Level", "Predicted_Next_Stop_Occupancy", "Anomaly_Flag",
        "Station_Popularity", "Passenger_Density_Score", "Coach_Heatmap_Index"
    ]
    df = df[required_cols]

    print("Generation complete! Saving to CSV...")
    csv_filename = "SmartRail_1Year_Data.csv"
    df.to_csv(csv_filename, index=False)
    print(f"Dataset successfully saved as '{csv_filename}'.\n")

    # Output stats
    print("--- df.head() ---")
    print(df.head())
    print("\n--- df.info() ---")
    print(df.info())
    print("\n--- df.describe() ---")
    print(df.describe())

    total_rows = len(df)
    total_cols = len(df.columns)
    file_size_mb = os.path.getsize(csv_filename) / (1024 * 1024)

    print("\n--- Summary Metrics ---")
    print(f"Total Rows: {total_rows}")
    print(f"Total Columns: {total_cols}")
    print(f"CSV File Size: {file_size_mb:.2f} MB")

if __name__ == "__main__":
    generate_smartrail_dataset()
