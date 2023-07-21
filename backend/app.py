from flask import Flask, request, Response, render_template
from flask_sqlalchemy import SQLAlchemy
from shapely.geometry import Point, LinearRing
from shapely.geometry.polygon import Polygon
from shapely.validation import explain_validity
import os
import json

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
  tokens = len(Token.query.all())
  return render_template('hello.html', tokens=tokens)

@app.route("/check", methods=['POST'])
def check():
    """Receives a bounding box of lat/lon coordinates, and returns a list of tokens that have points within that box.
    
    Expects format of:
    {
        'points': [{'lat': ___ , 'lon': ___}, ...]
    }
    """

    points = [(float(p['lat']), float(p['lon'])) for p in request.json['points']]
    test_shape = LinearRing(points)
    if not test_shape.is_valid:
        return {
            "valid": False,
            "message": explain_validity(test_shape)
        }, 422
    success, conflicts = do_check(points)
    return {
        "valid": success,
        "conflicts": conflicts
    }, 200 if success else 409

@app.route("/submit", methods=['POST'])
def submit():
    request_data = request.get_json()
    points = [(float(p['lat']), float(p['lon'])) for p in request.json['points']]
    success, conflicts = do_check(points)
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
            "uri": f"{request.host_url}uri/token-{token.id}.json"
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
    
@app.route("/all", methods=['GET'])
def get_all():
    tokens = Token.query.all()
    return {
        "tokens": [{
            "token_id": token.id,
            "points": token.boundary
        } for token in tokens]
    }
    
@app.route("/uri/token-<token_id>.json")
def get_item(token_id: int):
    """This route pretends to serve a static JSON file, however it just returns the token data directly.

    Args:
        token_id (int): The (backend) id of the token to return

    Returns:
        int: The backend token ID
        list[{'lat': float, 'lon': float}]: A list of points that when connected as a linear ring, form a boundary for the token.
    """
    token = Token.query.filter_by(id=token_id).first()
    if token is None:
        return 404
    content = {
        "token_id": token.id,
        "points": token.boundary,
        "description": "A block of land",
        "animation_url": request.base_url.split('/uri/')[0] + f"/uri/token-{token_id}.html",
    }
    return Response(json.dumps(content),
                    mimetype='application/json',
                    headers={'Content-Disposition':f'attachment;filename=token-{token.id}.json'}
                    )
    
@app.route("/uri/token-<token_id>.html")
def get_token_map(token_id: int):
    token = Token.query.filter_by(id=token_id).first()
    if token is None:
        return 404
    center = token.LinearRing.centroid
    center_formatted = [center.x, center.y]
    bounding_box = [[p.lon, p.lat] for p in token.points]
    bounding_box += bounding_box[0]
    return render_template('token.html', token=token, center=center_formatted, bounding_box=bounding_box)
    
# Helper functions
def do_check(points):
    tokens = Token.query.all()
    # Iterate through all tokens, create boundary box of them and see if any of the points are within them
    conflict_ids = []
    for token in tokens:
        token_ring = token.LinearRing
        other_ring = LinearRing(points)
        if token_ring.intersects(other_ring):
            conflict_ids.append(token.id)
    return len(conflict_ids) == 0, conflict_ids



with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)