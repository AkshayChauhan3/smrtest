# Mapping of ALL Flutter app hardcoded station IDs to backend database station IDs
FLUTTER_TO_BACKEND_STATIONS = {
    # Blue Line (Flutter)
    "VG": "BL01",   # Vastral Gam
    "AP": "BL06",   # Apparel Park
    "AW": "BL05",   # Amraiwadi (Amraivadi)
    "RC": "BL04",   # Rabari Colony
    "RH": "BL06",   # Rajpur Hirpur -> Fallback to Apparel Park
    "OD": "BL03",   # Odhav -> Fallback to Vastral
    "NC": "BL02",   # Nirant Cross Road
    "GY": "BL08",   # Gyaspur -> Fallback to Kalupur
    "SB": "BL07",   # Saijpur Bogha -> Fallback to Kankaria East
    "SJ": "BL07",   # Saijpur -> Fallback to Kankaria East
    "BN": "BL08",   # Bapu Nagar -> Fallback to Kalupur
    "KE": "BL07",   # Kankaria East
    "KW": "BL07",   # Kankaria West -> Fallback to Kankaria East
    "MN": "BL08",   # Maninagar -> Fallback to Kalupur
    "SH": "BL10",   # Shahpur
    "KC": "BL08",   # Kalupur (Central) -> Kalupur Metro Station
    "GK": "BL09",   # Gheekanta -> Ghee Kanta
    "OHC": "BL11",  # Old High Court
    "PL": "RL05",   # Paldi
    "SY": "RL04",   # Shreyas
    "JP": "RL02",   # Jivraj Park
    "RN": "RL03",   # Rajivnagar
    "JN": "RL02",   # Jivrajnagar -> Fallback to Jivraj Park
    "VS": "RL01",   # Vasna -> Fallback to APMC
    "TG": "BL17",   # Thaltej

    # Red Line (Flutter)
    "MS": "RL15",   # Motera Stadium
    "SM": "RL14",   # Sabarmati
    "RP": "RL11",   # Ranip
    "CD": "RL13",   # Chandlodia -> Fallback to AEC
    "VJ": "RL10",   # Vadaj
    "VT": "RL15",   # Visat -> Fallback to Motera Stadium
    "CK": "RL15",   # Chandkheda -> Fallback to Motera Stadium
    "SRS": "RL12",  # Sabarmati Railway Station
    "SC": "RL15",   # Science City -> Fallback to Motera Stadium
    "BP": "RL01",   # Bhopal -> Fallback to APMC
    "GN": "RL15",   # GNLU -> Fallback to Motera Stadium
}

def translate_station_id(station_id: str | None) -> str | None:
    if not station_id:
        return station_id
    upper_id = station_id.upper().strip()
    return FLUTTER_TO_BACKEND_STATIONS.get(upper_id, upper_id)
