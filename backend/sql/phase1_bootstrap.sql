\set ON_ERROR_STOP on

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS lines (
    line_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20),
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS stations (
    station_id VARCHAR(8) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    line_id VARCHAR(8) NOT NULL REFERENCES lines(line_id),
    is_interchange BOOLEAN DEFAULT FALSE,
    is_busy BOOLEAN DEFAULT FALSE,
    cumulative_km DOUBLE PRECISION NOT NULL,
    sort_order INTEGER NOT NULL
);

ALTER TABLE stations DROP CONSTRAINT IF EXISTS stations_name_key;

CREATE INDEX IF NOT EXISTS idx_stations_name ON stations(name);
CREATE INDEX IF NOT EXISTS idx_stations_line_id ON stations(line_id);

CREATE TABLE IF NOT EXISTS routes (
    route_id VARCHAR(16) PRIMARY KEY,
    line_id VARCHAR(8) NOT NULL REFERENCES lines(line_id),
    direction VARCHAR(8) NOT NULL,
    origin_station_id VARCHAR(8) NOT NULL REFERENCES stations(station_id),
    destination_station_id VARCHAR(8) NOT NULL REFERENCES stations(station_id),
    runtime_minutes INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS route_stops (
    id BIGSERIAL PRIMARY KEY,
    route_id VARCHAR(16) NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
    station_id VARCHAR(8) NOT NULL REFERENCES stations(station_id),
    stop_order INTEGER NOT NULL,
    arrival_offset_minutes INTEGER NOT NULL,
    departure_offset_minutes INTEGER NOT NULL,
    dwell_minutes INTEGER NOT NULL DEFAULT 1
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'route_stops_route_stop_key'
    ) THEN
        ALTER TABLE route_stops
        ADD CONSTRAINT route_stops_route_stop_key UNIQUE (route_id, stop_order);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS trains (
    train_id VARCHAR(32) PRIMARY KEY,
    train_name VARCHAR(100) NOT NULL,
    line_id VARCHAR(8) NOT NULL REFERENCES lines(line_id),
    direction VARCHAR(16) NOT NULL,
    current_station_id VARCHAR(8),
    next_station_id VARCHAR(8),
    capacity INTEGER NOT NULL DEFAULT 1200,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS train_coaches (
    id BIGSERIAL PRIMARY KEY,
    train_id VARCHAR(32) NOT NULL REFERENCES trains(train_id) ON DELETE CASCADE,
    coach_number VARCHAR(8) NOT NULL,
    coach_type VARCHAR(16) NOT NULL,
    capacity INTEGER NOT NULL
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'train_coaches_train_coach_key'
    ) THEN
        ALTER TABLE train_coaches
        ADD CONSTRAINT train_coaches_train_coach_key UNIQUE (train_id, coach_number);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'passenger',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS saved_routes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    line_id VARCHAR(8) NOT NULL,
    from_station_id VARCHAR(8) NOT NULL,
    to_station_id VARCHAR(8) NOT NULL,
    label VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

INSERT INTO lines (line_id, name, color, active)
VALUES
    ('BL', 'Blue Line', 'Blue', TRUE),
    ('RL', 'Red Line', 'Red', TRUE)
ON CONFLICT (line_id) DO UPDATE
SET name = EXCLUDED.name,
    color = EXCLUDED.color,
    active = EXCLUDED.active;

INSERT INTO stations (station_id, name, line_id, is_interchange, is_busy, cumulative_km, sort_order)
VALUES
    ('BL01', 'Vastral Gam', 'BL', FALSE, FALSE, 0.00, 1),
    ('BL02', 'Nirant Cross Road', 'BL', FALSE, FALSE, 1.20, 2),
    ('BL03', 'Vastral', 'BL', FALSE, FALSE, 2.30, 3),
    ('BL04', 'Rabari Colony', 'BL', FALSE, FALSE, 3.50, 4),
    ('BL05', 'Amraivadi', 'BL', FALSE, FALSE, 4.70, 5),
    ('BL06', 'Apparel Park', 'BL', FALSE, FALSE, 6.00, 6),
    ('BL07', 'Kankaria East', 'BL', FALSE, FALSE, 7.30, 7),
    ('BL08', 'Kalupur Metro Station', 'BL', TRUE, TRUE, 8.60, 8),
    ('BL09', 'Ghee Kanta', 'BL', FALSE, FALSE, 9.70, 9),
    ('BL10', 'Shahpur', 'BL', FALSE, FALSE, 10.80, 10),
    ('BL11', 'Old High Court', 'BL', TRUE, TRUE, 11.90, 11),
    ('BL12', 'S P Stadium', 'BL', FALSE, TRUE, 13.10, 12),
    ('BL13', 'Commerce Six Road', 'BL', FALSE, FALSE, 14.30, 13),
    ('BL14', 'Gujarat University', 'BL', FALSE, TRUE, 15.60, 14),
    ('BL15', 'Gurukul Road', 'BL', FALSE, FALSE, 16.80, 15),
    ('BL16', 'Doordarshan Kendra', 'BL', FALSE, FALSE, 18.00, 16),
    ('BL17', 'Thaltej', 'BL', FALSE, FALSE, 19.20, 17),
    ('BL18', 'Thaltej Gam', 'BL', FALSE, FALSE, 20.40, 18),
    ('RL01', 'APMC', 'RL', FALSE, FALSE, 0.00, 1),
    ('RL02', 'Jivraj Park', 'RL', FALSE, FALSE, 1.40, 2),
    ('RL03', 'Rajivnagar', 'RL', FALSE, FALSE, 2.60, 3),
    ('RL04', 'Shreyas', 'RL', FALSE, FALSE, 3.80, 4),
    ('RL05', 'Paldi', 'RL', FALSE, FALSE, 5.00, 5),
    ('RL06', 'Gandhigram', 'RL', TRUE, TRUE, 6.30, 6),
    ('RL07', 'Old High Court', 'RL', TRUE, TRUE, 7.50, 7),
    ('RL08', 'Usmanpura', 'RL', FALSE, FALSE, 8.60, 8),
    ('RL09', 'Vijay Nagar', 'RL', FALSE, FALSE, 9.70, 9),
    ('RL10', 'Vadaj', 'RL', FALSE, FALSE, 10.80, 10),
    ('RL11', 'Ranip', 'RL', FALSE, FALSE, 11.90, 11),
    ('RL12', 'Sabarmati Rly Station', 'RL', TRUE, TRUE, 13.10, 12),
    ('RL13', 'AEC', 'RL', FALSE, FALSE, 14.20, 13),
    ('RL14', 'Sabarmati', 'RL', FALSE, FALSE, 15.30, 14),
    ('RL15', 'Motera Stadium', 'RL', FALSE, TRUE, 16.50, 15)
ON CONFLICT (station_id) DO UPDATE
SET name = EXCLUDED.name,
    line_id = EXCLUDED.line_id,
    is_interchange = EXCLUDED.is_interchange,
    is_busy = EXCLUDED.is_busy,
    cumulative_km = EXCLUDED.cumulative_km,
    sort_order = EXCLUDED.sort_order;

INSERT INTO routes (route_id, line_id, direction, origin_station_id, destination_station_id, runtime_minutes)
VALUES
    ('BL-UP', 'BL', 'UP', 'BL01', 'BL18', 45),
    ('BL-DOWN', 'BL', 'DOWN', 'BL18', 'BL01', 43),
    ('RL-UP', 'RL', 'UP', 'RL01', 'RL15', 32),
    ('RL-DOWN', 'RL', 'DOWN', 'RL15', 'RL01', 31)
ON CONFLICT (route_id) DO UPDATE
SET line_id = EXCLUDED.line_id,
    direction = EXCLUDED.direction,
    origin_station_id = EXCLUDED.origin_station_id,
    destination_station_id = EXCLUDED.destination_station_id,
    runtime_minutes = EXCLUDED.runtime_minutes;

INSERT INTO route_stops (route_id, station_id, stop_order, arrival_offset_minutes, departure_offset_minutes, dwell_minutes)
SELECT * FROM (
    VALUES
        ('BL-UP', 'BL01', 1, 0, 3, 3),
        ('BL-UP', 'BL02', 2, 6, 7, 1),
        ('BL-UP', 'BL03', 3, 10, 11, 1),
        ('BL-UP', 'BL04', 4, 14, 15, 1),
        ('BL-UP', 'BL05', 5, 18, 19, 1),
        ('BL-UP', 'BL06', 6, 22, 23, 1),
        ('BL-UP', 'BL07', 7, 26, 27, 1),
        ('BL-UP', 'BL08', 8, 30, 31, 1),
        ('BL-UP', 'BL09', 9, 34, 35, 1),
        ('BL-UP', 'BL10', 10, 38, 39, 1),
        ('BL-UP', 'BL11', 11, 42, 43, 1),
        ('BL-UP', 'BL12', 12, 45, 46, 1),
        ('BL-UP', 'BL13', 13, 49, 50, 1),
        ('BL-UP', 'BL14', 14, 53, 54, 1),
        ('BL-UP', 'BL15', 15, 56, 57, 1),
        ('BL-UP', 'BL16', 16, 60, 61, 1),
        ('BL-UP', 'BL17', 17, 64, 65, 1),
        ('BL-UP', 'BL18', 18, 68, 71, 3),
        ('BL-DOWN', 'BL18', 1, 0, 3, 3),
        ('BL-DOWN', 'BL17', 2, 6, 7, 1),
        ('BL-DOWN', 'BL16', 3, 10, 11, 1),
        ('BL-DOWN', 'BL15', 4, 14, 15, 1),
        ('BL-DOWN', 'BL14', 5, 18, 19, 1),
        ('BL-DOWN', 'BL13', 6, 22, 23, 1),
        ('BL-DOWN', 'BL12', 7, 26, 27, 1),
        ('BL-DOWN', 'BL11', 8, 30, 31, 1),
        ('BL-DOWN', 'BL10', 9, 34, 35, 1),
        ('BL-DOWN', 'BL09', 10, 38, 39, 1),
        ('BL-DOWN', 'BL08', 11, 42, 43, 1),
        ('BL-DOWN', 'BL07', 12, 45, 46, 1),
        ('BL-DOWN', 'BL06', 13, 49, 50, 1),
        ('BL-DOWN', 'BL05', 14, 53, 54, 1),
        ('BL-DOWN', 'BL04', 15, 56, 57, 1),
        ('BL-DOWN', 'BL03', 16, 60, 61, 1),
        ('BL-DOWN', 'BL02', 17, 64, 65, 1),
        ('BL-DOWN', 'BL01', 18, 68, 71, 3),
        ('RL-UP', 'RL01', 1, 0, 3, 3),
        ('RL-UP', 'RL02', 2, 5, 6, 1),
        ('RL-UP', 'RL03', 3, 8, 9, 1),
        ('RL-UP', 'RL04', 4, 11, 12, 1),
        ('RL-UP', 'RL05', 5, 14, 15, 1),
        ('RL-UP', 'RL06', 6, 17, 18, 1),
        ('RL-UP', 'RL07', 7, 20, 21, 1),
        ('RL-UP', 'RL08', 8, 23, 24, 1),
        ('RL-UP', 'RL09', 9, 26, 27, 1),
        ('RL-UP', 'RL10', 10, 29, 30, 1),
        ('RL-UP', 'RL11', 11, 31, 32, 1),
        ('RL-UP', 'RL12', 12, 34, 35, 1),
        ('RL-UP', 'RL13', 13, 37, 38, 1),
        ('RL-UP', 'RL14', 14, 40, 41, 1),
        ('RL-UP', 'RL15', 15, 43, 46, 3),
        ('RL-DOWN', 'RL15', 1, 0, 3, 3),
        ('RL-DOWN', 'RL14', 2, 5, 6, 1),
        ('RL-DOWN', 'RL13', 3, 8, 9, 1),
        ('RL-DOWN', 'RL12', 4, 11, 12, 1),
        ('RL-DOWN', 'RL11', 5, 14, 15, 1),
        ('RL-DOWN', 'RL10', 6, 17, 18, 1),
        ('RL-DOWN', 'RL09', 7, 20, 21, 1),
        ('RL-DOWN', 'RL08', 8, 23, 24, 1),
        ('RL-DOWN', 'RL07', 9, 26, 27, 1),
        ('RL-DOWN', 'RL06', 10, 29, 30, 1),
        ('RL-DOWN', 'RL05', 11, 31, 32, 1),
        ('RL-DOWN', 'RL04', 12, 34, 35, 1),
        ('RL-DOWN', 'RL03', 13, 37, 38, 1),
        ('RL-DOWN', 'RL02', 14, 40, 41, 1),
        ('RL-DOWN', 'RL01', 15, 43, 46, 3)
) AS v(route_id, station_id, stop_order, arrival_offset_minutes, departure_offset_minutes, dwell_minutes)
ON CONFLICT ON CONSTRAINT route_stops_route_stop_key DO NOTHING;

INSERT INTO trains (train_id, train_name, line_id, direction, capacity, status)
VALUES
    ('BL-UP-01', 'Blue Line · UP', 'BL', 'UP', 1200, 'ACTIVE'),
    ('BL-UP-02', 'Blue Line · UP', 'BL', 'UP', 1200, 'ACTIVE'),
    ('BL-UP-03', 'Blue Line · UP', 'BL', 'UP', 1200, 'ACTIVE'),
    ('BL-UP-04', 'Blue Line · UP', 'BL', 'UP', 1200, 'ACTIVE'),
    ('BL-UP-05', 'Blue Line · UP', 'BL', 'UP', 1200, 'ACTIVE'),
    ('BL-UP-06', 'Blue Line · UP', 'BL', 'UP', 1200, 'ACTIVE'),
    ('BL-DO-01', 'Blue Line · DOWN', 'BL', 'DOWN', 1200, 'ACTIVE'),
    ('BL-DO-02', 'Blue Line · DOWN', 'BL', 'DOWN', 1200, 'ACTIVE'),
    ('BL-DO-03', 'Blue Line · DOWN', 'BL', 'DOWN', 1200, 'ACTIVE'),
    ('BL-DO-04', 'Blue Line · DOWN', 'BL', 'DOWN', 1200, 'ACTIVE'),
    ('BL-DO-05', 'Blue Line · DOWN', 'BL', 'DOWN', 1200, 'ACTIVE'),
    ('RL-UP-01', 'Red Line · UP', 'RL', 'UP', 1200, 'ACTIVE'),
    ('RL-UP-02', 'Red Line · UP', 'RL', 'UP', 1200, 'ACTIVE'),
    ('RL-UP-03', 'Red Line · UP', 'RL', 'UP', 1200, 'ACTIVE'),
    ('RL-UP-04', 'Red Line · UP', 'RL', 'UP', 1200, 'ACTIVE'),
    ('RL-UP-05', 'Red Line · UP', 'RL', 'UP', 1200, 'ACTIVE'),
    ('RL-DO-01', 'Red Line · DOWN', 'RL', 'DOWN', 1200, 'ACTIVE'),
    ('RL-DO-02', 'Red Line · DOWN', 'RL', 'DOWN', 1200, 'ACTIVE'),
    ('RL-DO-03', 'Red Line · DOWN', 'RL', 'DOWN', 1200, 'ACTIVE'),
    ('RL-DO-04', 'Red Line · DOWN', 'RL', 'DOWN', 1200, 'ACTIVE'),
    ('RL-DO-05', 'Red Line · DOWN', 'RL', 'DOWN', 1200, 'ACTIVE')
ON CONFLICT (train_id) DO UPDATE
SET train_name = EXCLUDED.train_name,
    line_id = EXCLUDED.line_id,
    direction = EXCLUDED.direction,
    capacity = EXCLUDED.capacity,
    status = EXCLUDED.status;

INSERT INTO train_coaches (train_id, coach_number, coach_type, capacity)
SELECT t.train_id, v.coach_number, v.coach_type, v.capacity
FROM (
    VALUES
        ('BL-UP-01'), ('BL-UP-02'), ('BL-UP-03'), ('BL-UP-04'), ('BL-UP-05'), ('BL-UP-06'),
        ('BL-DO-01'), ('BL-DO-02'), ('BL-DO-03'), ('BL-DO-04'), ('BL-DO-05'),
        ('RL-UP-01'), ('RL-UP-02'), ('RL-UP-03'), ('RL-UP-04'), ('RL-UP-05'),
        ('RL-DO-01'), ('RL-DO-02'), ('RL-DO-03'), ('RL-DO-04'), ('RL-DO-05')
) AS t(train_id)
JOIN (
    VALUES
        ('C1', 'GENERAL', 400),
        ('C2', 'LADIES', 400),
        ('C3', 'GENERAL', 400)
) AS v(coach_number, coach_type, capacity) ON TRUE
ORDER BY t.train_id, v.coach_number
ON CONFLICT ON CONSTRAINT train_coaches_train_coach_key DO NOTHING;

COMMIT;
