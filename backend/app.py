from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from shapely.geometry import Point, LinearRing
from shapely.geometry.polygon import Polygon
from shapely.validation import explain_validity
import os

app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] =\
        'sqlite:///' + os.path.join(basedir, 'database.db')
db = SQLAlchemy(app)

## Models

class Point(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token_id = db.Column(db.Integer, db.ForeignKey('token.id'), nullable=False)
    lat = db.Column(db.Float)
    lon = db.Column(db.Float)
    
    def __repr__(self):
        return '<Point for %r lat: %r lon: %r>' % self.token, self.lat, self.lon

class Token(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    points = db.Relationship('Point', backref='token', lazy=True)
    
    def __repr__(self):
        return '<Token %r>' % self.id
    
    @property
    def boundary(self):
        return [{'lat': p.lat, 'lon': p.lon} for p in self.points]
    
    @property
    def Polygon(self):
        return Polygon([(p.lat, p.lon) for p in self.points])
    
    @property
    def LinearRing(self):
        return LinearRing([(p.lat, p.lon) for p in self.points])



## Routes

@app.route("/")
def hello():
  return "Hello World!"

@app.route("/check", methods=['POST'])
def check():
    """Receives a bounding box of lat/lon coordinates, and returns a list of tokens that have points within that box.
    
    Expects format of:
    {
        'points': [{'lat': ___ , 'lon': ___}, ...]
    }
    """
    request_data = request.get_json()
    test_shape = LinearRing([(p['lat'], p['lon']) for p in request_data['points']])
    if not test_shape.intersects(Token.Polygon):
        return {
            "valid": False,
            "message": explain_validity(test_shape)
        }, 422
    success, conflicts = do_check(request_data['points'])
    return {
        "valid": success,
        "conflicts": conflicts
    }, 200 if success else 409

@app.route("/submit", methods=['POST'])
def submit():
    request_data = request.get_json()
    success, conflicts = do_check(request_data['points'])
    if success:
        token = Token()
        db.session.add(token)
        for point in request_data['points']:
            new_point = Point(token=token, lat=point['lat'], lon=point['lon'])
            db.session.add(new_point)
        db.session.commit()
        return {
            "success": True,
            "token_id": token.id,
            "url": f"/get?token_id={token.id}"
        }
    else:
        return {
            "success": False,
            "conflicts": conflicts,
        }, 409

@app.route("/change", methods=['POST'])
def change():
    return True

@app.route("/get", methods=['GET'])
def get():
    token_id = request.args.get('token_id')
    token = Token.query.filter_by(id=token_id).first()
    if token is None:
        return {}, 404
    return {
        "token_id": token.id,
        "points": token.boundary
    }
    
    
# Helper functions
def do_check(points):
    tokens = Token.query.all()
    # Iterate through all tokens, create boundary box of them and see if any of the points are within them
    conflict_ids = []
    for token in tokens:
        token_ring = token.LinearRing
        other_ring = LinearRing([(p['lat'], p['lon']) for p in points])
        if token_ring.intersects(other_ring):
            conflict_ids.append(token.id)
    return len(conflict_ids) == 0, conflict_ids



with app.app_context():
    db.create_all()

if __name__ == "__main__":

    #path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db")
    app.run(debug=True)