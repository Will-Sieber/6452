from flask import Flask, request, Response, render_template, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename
from shapely.geometry import Point, LinearRing
from shapely.geometry.polygon import Polygon
from shapely.validation import explain_validity
import os
import json

from flask_migrate import Migrate


UPLOAD_FOLDER = 'hosted-files/'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg'}

app = Flask(__name__)
CORS(app)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] =\
        'sqlite:///' + os.path.join(basedir, 'database.db')
app.config['UPLOAD_FOLDER'] = os.path.join(basedir, UPLOAD_FOLDER)
db = SQLAlchemy(app)
migrate = Migrate(app, db)

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.mkdir(app.config['UPLOAD_FOLDER'])

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
    points = db.relationship('Point', backref='area', lazy=True, cascade='all, delete-orphan')
    boundary_id = db.Column(db.Integer, db.ForeignKey('token.id'), nullable=True)
    hole_id = db.Column(db.Integer, db.ForeignKey('token.id'), nullable=True)
    
    def __repr__(self):
        return '<Area %r>' % self.id

class Token(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pending = db.Column(db.Boolean, default=True)
    initial_owner = db.Column(db.String(255), nullable=True, default="0x0000000000000000000000000000000000000000")
    boundary = db.relationship('Area', backref='token_boundary', lazy=True, foreign_keys=[Area.boundary_id], uselist=False, cascade='all, delete-orphan')
    holes = db.relationship('Area', backref='token_holes', lazy=True, foreign_keys=[Area.hole_id], cascade='all, delete-orphan')
    files = db.relationship('File', backref="token", lazy=True, cascade='all, delete-orphan')
    
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
    
class File(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    token_id = db.Column(db.Integer, db.ForeignKey('token.id'), nullable=False)

    def __repr__(self):
        return '<File %r>' % self.filename
    
    @property
    def usable_filename(self):
        return f"{self.token.id}-{self.id}-{self.filename}"



## Routes

@app.route("/")
def hello():
  return "Hello :)"

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
    not_touching = set()
    for token_outer in tokens:
        for token_inner in tokens:
            if token_outer.id == token_inner.id:
                continue
            if not token_outer.Polygon.touches(token_inner.Polygon):
                not_touching.add(token_outer.id)
    return {
        "valid": len(not_touching) == 0,
        "not_touching": list(not_touching)
    }

# File upload/download

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/files/upload', methods=['POST'])
def upload_file():
    data = request.form.to_dict()
    if 'file' in request.files:
        file = request.files['file']
        if 'reference_id' not in data:
            return {
                "success": False,
                "message": "No reference_id provided. Please provide a reference_id for an existing token, or set reference_id to None to create a new token."
            }, 400
        token = Token.query.filter_by(id=data['reference_id']).first()
        if token is None:
            return "Token not found", 404
        if data['reference_id'] is None:
            if 'submitter_address' not in data:
                return {
                    "Success": False,
                    "message": "No submitter_address provided. Please provide the address for the new token to be minted to once it has been approved."
                }, 400
            token = Token(pending=True)
            db.session.add(token)
        # If the user does not select a file, the browser submits an
        # empty file without a filename.
        if file and file.filename != '' and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_obj = File(filename=filename, token=token)
            db.session.add(file_obj)
            db.session.commit()
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], file_obj.usable_filename))
            return {
                    "success": True,
                    "reference_id": None,
                    "filename": file_obj.usable_filename,
                }, 200
    else:
        print((request.__dict__))
        return "No file detected", 400

@app.route('/files/list', methods=['GET'])
def get_files():
    token_id = request.args.get('reference_id')
    if not token_id:
        return "Reference ID not provided", 400
    token = Token.query.filter_by(id=token_id).first()
    if token is None:
        return "Token not found", 404
    return {
        "filenames": [file.usable_filename for file in token.files]
    }

@app.route('/files/download/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Approval stuff

@app.route('/approve', methods=['POST'])
def approve():
    data = request.get_json()
    token = Token.query.filter_by(id=data['reference_id']).first()
    if token is None:
        return "Token not found", 404
    if token.boundary is None:
        return "Token has no boundary", 422
    token.pending = False
    db.session.commit()
    # TODO: NOW, GO MINT THE TOKEN
    return {
        "success": True
    }

@app.route('/set', methods=['PATCH'])
def set_token():
    # NOTE: this will completely replace the areas that are currently in the token
    data = request.get_json()
    token = Token.query.filter_by(id=data['reference_id']).first()
    if token is None:
        return "Token not found", 404
    points = [(float(p['lat']), float(p['lon'])) for p in data['points']]
    holes = [[(float(p['lat']), float(p['lon'])) for p in hole['points']] for hole in data['holes']]
    success, conflicts = do_check(points, holes)
    if not success:
        return {"success": False, "conflicts": conflicts}, 409
    token.boundary.delete()
    for hole in token.holes:
        hole.delete()
    db.session.commit()
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
    

@app.route('/reject', methods=['POST'])
def reject():
    data = request.get_json()
    token = Token.query.filter_by(id=data['reference_id'], pending=True).first()
    if token is None:
        return "Token not found", 404
    token.delete()
    db.session.commit()
    return {
        "success": True
    }

@app.route('/list/unapproved', methods=['GET'])
def list_unapproved():
    tokens = Token.query.filter_by(pending=True).all()
    return {
        "reference_ids": [token.id for token in tokens]
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
        if not check_allowed(token_obj, other_obj):
            conflict_ids.append(token.id)
    return len(conflict_ids) == 0, conflict_ids

# Full credit to https://stackoverflow.com/a/38745732
def check_allowed(pol1, pol2):
    allowed = None
    if ((pol1.intersects(pol2) == False) and (pol1.disjoint(pol2) == True)) or ((pol1.intersects(pol2) == True) and (pol1.touches(pol2) == True)):
        allowed = True
    elif (pol1.intersects(pol2) == True) and (pol1.disjoint(pol2) == False) and (pol1.touches(pol2) == False):
        allowed = False
    return allowed



with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)