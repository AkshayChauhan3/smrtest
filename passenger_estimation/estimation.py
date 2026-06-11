import pandas as pd
import requests
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from datetime import datetime

now = datetime.now()



df = pd.read_csv("metro.csv", low_memory=False)

df = df.sample(n=100000, random_state=42)

df["Festival"] = df["Festival"].fillna("No_Festival")
df["Festival"] = df["Festival"].astype(str)

df["Timestamp"] = pd.to_datetime(df["Timestamp"])

df["Hour"] = df["Timestamp"].dt.hour
df["Minute"] = df["Timestamp"].dt.minute
df["Day"] = df["Timestamp"].dt.day
df["Month"] = df["Timestamp"].dt.month
df["DayOfWeek"] = df["Timestamp"].dt.dayofweek
df["IsWeekend"] = (df["DayOfWeek"] >= 5).astype(int)

features = [
    "Station_ID",
    "Coach_Type",
    "Temperature",
    "Delay_Minutes",
    "ETA_Minutes",
    "Day_Type",
    "Weather",
    "Festival",
    "Hour",
    "Minute",
    "Day",
    "Month",
    "DayOfWeek",
    "IsWeekend"
]

target = "Passengers"


encoders = {}

categorical_columns = [
    "Station_ID",
    "Coach_Type",
    "Day_Type",
    "Weather",
    "Festival",
]

for col in categorical_columns:
    encoder = LabelEncoder()
    df[col] = encoder.fit_transform(df[col].astype(str))
    encoders[col] = encoder

X = df[features]
y = df[target]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
)

model = RandomForestRegressor(
    n_estimators=300,
    max_depth=20,
    min_samples_split=5,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)


predictions = model.predict(X_test)

mae = mean_absolute_error(y_test, predictions)

print(f"Mean Absolute Error: {mae:.2f}")

# getting current weather data

API_KEY = "YOUR_OPENWEATHERMAP_API_KEY"  # TODO: Move to .env

city = "Ahmedabad"

url = (
f"https://api.openweathermap.org/data/2.5/weather"
f"?q={city}&appid={API_KEY}&units=metric"
)

response = requests.get(url)
data = response.json()

temperature = data["main"]["temp"]
weather = data["weather"][0]["main"]

print("Current Temperature:", temperature)
print("Current Weather:", weather)

# new dummy input 

station_id = "BL07"
coach_type = "General"
day_type = "Weekday"
festival = "No_Festival"
delay_minutes = 2
eta_minutes = 3
hour = now.hour
minute = now.minute
day = now.day
month = now.month
day_of_week = now.weekday()
is_weekend = int(day_of_week >= 5)

# Handle unknown weather values

weather_encoder = encoders["Weather"]

if weather not in weather_encoder.classes_:
    weather = weather_encoder.classes_[0]

input_data = pd.DataFrame([{
    "Station_ID": encoders["Station_ID"].transform([station_id])[0],
    "Coach_Type": encoders["Coach_Type"].transform([coach_type])[0],
    "Temperature": temperature,
    "Delay_Minutes": delay_minutes,
    "ETA_Minutes": eta_minutes,
    "Day_Type": encoders["Day_Type"].transform([day_type])[0],
    "Weather": encoders["Weather"].transform([weather])[0],
    "Festival": encoders["Festival"].transform([festival])[0],
    "Hour": hour,
    "Minute": minute,
    "Day": day,
    "Month": month,
    "DayOfWeek": day_of_week,
    "IsWeekend": is_weekend
}])


predicted_passengers = model.predict(input_data)

importance = pd.DataFrame({
    "Feature": X.columns,
    "Importance": model.feature_importances_
}).sort_values(
    by="Importance",
    ascending=False
)

print(importance)

print(
    f"Predicted Passenger Count: "
    f"{int(predicted_passengers[0])}"
)
