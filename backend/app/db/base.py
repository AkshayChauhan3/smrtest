from app.models.base import Base
from app.models.user import User
from app.models.train import Train, TrainCoach, OccupancySnapshot
from app.models.station import Station
from app.models.route import Route, RouteStop, StationCrowdSnapshot
from app.models.alert import Alert
from app.models.prediction import Prediction
from app.models.saved_route import SavedRoute
from app.models.estimation import Estimation

# Import models here so metadata can discover them.
__all__ = [
    "Base", "User", "Train", "TrainCoach", "OccupancySnapshot",
    "Station", "Route", "RouteStop", "StationCrowdSnapshot",
    "Alert", "Prediction", "SavedRoute", "Estimation",
]