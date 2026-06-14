# Mapping of Flutter app hardcoded station IDs to backend database station IDs
FLUTTER_TO_BACKEND_STATIONS = {
    "VG": "BL01",   # Vastral Gam
    "NC": "BL02",   # Nirant Cross Road
    "AW": "BL05",   # Amraiwadi (Amraivadi)
    "RC": "BL04",   # Rabari Colony
    "AP": "BL06",   # Apparel Park
    "KE": "BL07",   # Kankaria East
    "KC": "BL08",   # Kalupur (Central) -> Kalupur Metro Station
    "GK": "BL09",   # Gheekanta -> Ghee Kanta
    "SH": "BL10",   # Shahpur
    "OHC": "BL11",  # Old High Court
    "PL": "RL05",   # Paldi
    "SY": "RL04",   # Shreyas
    "JP": "RL02",   # Jivraj Park
    "RN": "RL03",   # Rajivnagar
    "TG": "BL17",   # Thaltej
    "MS": "RL15",   # Motera Stadium
    "SM": "RL14",   # Sabarmati
    "RP": "RL11",   # Ranip
    "VJ": "RL10",   # Vadaj
    "SRS": "RL12",  # Sabarmati Railway Station
}

def translate_station_id(station_id: str | None) -> str | None:
    if not station_id:
        return station_id
    upper_id = station_id.upper().strip()
    return FLUTTER_TO_BACKEND_STATIONS.get(upper_id, upper_id)
