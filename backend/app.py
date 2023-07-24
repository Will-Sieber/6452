from flask import Flask, request, Response, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

from shapely.geometry import Point, LinearRing
from shapely.geometry.polygon import Polygon
from shapely.validation import explain_validity
import os
import json

app = Flask(__name__)
CORS(app)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] =\
        'sqlite:///' + os.path.join(basedir, 'database.db')
db = SQLAlchemy(app)

## Models

class Point(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    area_id = db.Column(db.Integer, db.ForeignKey('area.id'), nullable=False)
    lat = db.Column(db.Float)
    lon = db.Column(db.Float)
    
    def __repr__(self):
        return '<Point for %r lat: %r lon: %r>' % self.area, self.lat, self.lon
    
class Area(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    points = db.Relationship('Point', backref='area', lazy=True)
    boundary_id = db.Column(db.Integer, db.ForeignKey('token.id'), nullable=True)
    hole_id = db.Column(db.Integer, db.ForeignKey('token.id'), nullable=True)
    
    def __repr__(self):
        return '<Area %r>' % self.id

class Token(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pending = db.Column(db.Boolean, default=True)
    boundary = db.Relationship('Area', backref='token_boundary', lazy=True, foreign_keys=[Area.boundary_id], uselist=False)
    holes = db.Relationship('Area', backref='token_holes', lazy=True, foreign_keys=[Area.hole_id])
    
    def __repr__(self):
        return '<Token %r>' % self.id
    
    @property
    def Boundary(self):
        return [{'lat': p.lat, 'lon': p.lon} for p in self.boundary.points]
    
    @property
    def Holes(self):
        return [[{'lat': p.lat, 'lon': p.lon} for p in hole.points] for hole in self.holes]
    
    @property
    def Polygon(self):
        return Polygon([(p.lat, p.lon) for p in self.boundary.points], holes=[[(p.lat, p.lon) for p in hole.points] for hole in self.holes])
    
    @property
    def LinearRing(self):
        return LinearRing([(p.lat, p.lon) for p in self.boundary.points])



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
    data = request.get_json()
    if 'holes' not in data:
        data['holes'] = []

    points = [(float(p['lat']), float(p['lon'])) for p in data['points']]
    holes = [[(float(p['lat']), float(p['lon'])) for p in hole['points']] for hole in data['holes']]
    test_shape = Polygon(points, holes=holes)
    if not test_shape.is_valid:
        return {
            "valid": False,
            "message": explain_validity(test_shape)
        }, 422
    success, conflicts = do_check(points, holes)
    return {
        "valid": success,
        "conflicts": conflicts
    }, 200 if success else 409

@app.route("/submit", methods=['POST'])
def submit():
    data = request.get_json()
    if 'holes' not in data:
        data['holes'] = []
    points = [(float(p['lat']), float(p['lon'])) for p in data['points']]
    holes = [[(float(p['lat']), float(p['lon'])) for p in hole['points']] for hole in data['holes']]
    success, conflicts = do_check(points, holes)
    if success:
        token = Token()
        db.session.add(token)
        if len(points) > 0:
            boundary = Area()
            for point in data['points']:
                new_point = Point(area=boundary, lat=point['lat'], lon=point['lon'])
                db.session.add(new_point)
            token.boundary = boundary
        if len(data['holes']) > 0:
            for hole in data['holes']:
                new_hole = Area()
                for point in hole['points']:
                    new_point = Point(area=new_hole, lat=point['lat'], lon=point['lon'])
                    db.session.add(new_point)
                token.holes.append(new_hole)
        db.session.commit()
        return {
            "success": True,
            "reference_id": token.id,
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
        "reference_id": token.id,
        "boundary": token.Boundary,
        "holes": token.Holes
    }
    
@app.route("/all", methods=['GET'])
def get_all():
    tokens = Token.query.all()
    return {
        "tokens": [{
            "reference_id": token.id,
            "boundary": token.Boundary,
            "holes": token.Holes
        } for token in tokens]
    }
    
    
@app.route('/check/merge', methods=['POST'])
def check_merge():
    data = request.get_json()
    # NOTE: These need to be backend 'reference ids', not the actual token ids
    token_ids = data['reference_ids']
    tokens = Token.query.filter(Token.id.in_(token_ids)).all()
    # We need to make sure that all tokens are touching each other
    for token in tokens:
        pass
    
    return {
        "valid": None,
        "not_touching": []
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
        "reference_id": token.id,
        "boundary": token.Boundary,
        "holes": token.Holes,
        "name": f"LandToken %{token.id}",
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
    center = token.Polygon.centroid
    center_formatted = [center.x, center.y]
    bounding_box = [[p.lon, p.lat] for p in token.boundary.points]
    bounding_box += [bounding_box[0]]
    holes_bbox = [[[p.lon, p.lat] for p in hole.points] for hole in token.holes]
    for hole in holes_bbox:
        hole.append(hole[0])
    return render_template('token.html', token=token, center=center_formatted, bounding_box=bounding_box, holes=holes_bbox)
    
# Helper functions
def do_check(points, holes):
    tokens = Token.query.all()
    # Iterate through all tokens, create boundary box of them and see if any of the points are within them
    conflict_ids = []
    for token in tokens:
        token_obj = token.Polygon
        other_obj = Polygon(points, holes=holes)
        if token_obj.intersects(other_obj):
            conflict_ids.append(token.id)
    return len(conflict_ids) == 0, conflict_ids



with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)