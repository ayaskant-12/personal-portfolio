from flask import Flask, render_template, request, jsonify
from flask_login import LoginManager
from models import db, Projects, Skills, Bio, SocialLinks, ContactSubmission
from auth import auth
from admin_routes import admin
from config import config
import os

def create_app():
    # Get the base directory of the project
    base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    template_dir = os.path.join(base_dir, 'frontend', 'templates')
    static_dir = os.path.join(base_dir, 'frontend', 'static')
    
    app = Flask(__name__, 
                template_folder=template_dir,
                static_folder=static_dir)
    app.config.from_object(config['development'])
    
    # Initialize extensions
    db.init_app(app)
    
    # Login manager
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message_category = 'error'
    
    @login_manager.user_loader
    def load_user(user_id):
        from models import Admin
        return Admin.query.get(int(user_id))
    
    # Register blueprints
    app.register_blueprint(auth)
    app.register_blueprint(admin)
    
    # Create upload directories
    uploads_dir = os.path.join(static_dir, 'uploads')
    os.makedirs(os.path.join(uploads_dir, 'projects'), exist_ok=True)
    os.makedirs(os.path.join(uploads_dir, 'profile'), exist_ok=True)
    os.makedirs(os.path.join(uploads_dir, 'certifications'), exist_ok=True)
    
    # Main portfolio routes
    @app.route('/')
    def index():
        bio = Bio.query.first()
        skills = Skills.query.order_by(Skills.display_order).all()
        projects = Projects.query.filter_by(featured=True).order_by(Projects.created_at.desc()).all()
        social_links = SocialLinks.query.order_by(SocialLinks.display_order).all()
        
        return render_template('index.html', 
                             bio=bio, 
                             skills=skills, 
                             projects=projects, 
                             social_links=social_links)
    
    @app.route('/contact', methods=['POST'])
    def contact():
        try:
            name = request.form.get('name')
            email = request.form.get('email')
            subject = request.form.get('subject')
            message = request.form.get('message')
            
            contact_submission = ContactSubmission(
                name=name,
                email=email,
                subject=subject,
                message=message
            )
            
            db.session.add(contact_submission)
            db.session.commit()
            
            return jsonify({'success': True, 'message': 'Message sent successfully!'})
        except Exception as e:
            return jsonify({'success': False, 'message': 'Error sending message: ' + str(e)})
    
    @app.route('/api/projects')
    def api_projects():
        projects = Projects.query.order_by(Projects.created_at.desc()).all()
        projects_data = []
        for project in projects:
            projects_data.append({
                'id': project.id,
                'title': project.title,
                'description': project.description,
                'tech_stack': project.tech_stack,
                'project_link': project.project_link,
                'github_link': project.github_link,
                'image_url': project.image_url,
                'featured': project.featured
            })
        return jsonify(projects_data)
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    with app.app_context():
        db.create_all()
        
        # Create default admin if not exists
        from models import Admin
        if not Admin.query.first():
            admin = Admin(username='admin')
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Default admin created: username='admin', password='admin123'")
    
    app.run(debug=True)
