import sys
import os

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import db, Admin, Bio, Skills, SocialLinks, Projects, ContactSubmission

def init_sample_data():
    app = create_app()
    
    with app.app_context():
        # CREATE ALL TABLES FIRST
        print("Creating database tables...")
        db.create_all()
        print("Tables created successfully!")
        
        # Create default admin
        if not Admin.query.first():
            admin = Admin(username='admin')
            admin.set_password('admin123')
            db.session.add(admin)
            print("Default admin created: username='admin', password='admin123'")
        
        # Create sample bio
        if not Bio.query.first():
            bio = Bio(
                name="Ayaskant Dash",
                tagline="Full-Stack Developer & AI Enthusiast",
                about_me="""Computer Science undergraduate with hands-on experience in full-stack development, 
                cloud computing, and AI-powered applications. Skilled in building scalable web applications, 
                real-time chat systems, and interactive dashboards.""",
                email="ayaskant2003@gmail.com",
                phone="+91 7008412057",
                location="Bhubaneswar, India",
                resume_url="/static/docs/resume.pdf"
            )
            db.session.add(bio)
            print("Sample bio created!")
        
        # Create sample skills
        if not Skills.query.first():
            skills_data = [
                {"name": "Python", "level": 85, "category": "Programming", "icon": "fab fa-python"},
                {"name": "JavaScript", "level": 80, "category": "Programming", "icon": "fab fa-js-square"},
                {"name": "Flask", "level": 75, "category": "Framework", "icon": "fas fa-flask"},
                {"name": "React", "level": 70, "category": "Framework", "icon": "fab fa-react"},
                {"name": "PostgreSQL", "level": 80, "category": "Database", "icon": "fas fa-database"},
                {"name": "MongoDB", "level": 70, "category": "Database", "icon": "fas fa-leaf"},
                {"name": "AWS", "level": 70, "category": "Cloud", "icon": "fab fa-aws"},
                {"name": "Docker", "level": 65, "category": "DevOps", "icon": "fab fa-docker"},
            ]
            
            for i, skill in enumerate(skills_data):
                db.session.add(Skills(
                    skill_name=skill["name"],
                    proficiency_level=skill["level"],
                    category=skill["category"],
                    icon_class=skill["icon"],
                    display_order=i
                ))
            print("Sample skills created!")
        
        # Create social links
        if not SocialLinks.query.first():
            social_data = [
                {"platform": "LinkedIn", "url": "https://linkedin.com/in/ayaskant-dash", "icon": "fab fa-linkedin"},
                {"platform": "GitHub", "url": "https://github.com/ayaskant-12", "icon": "fab fa-github"},
                {"platform": "Email", "url": "mailto:ayaskant2003@gmail.com", "icon": "fas fa-envelope"},
            ]
            
            for i, social in enumerate(social_data):
                db.session.add(SocialLinks(
                    platform=social["platform"],
                    url=social["url"],
                    icon_class=social["icon"],
                    display_order=i
                ))
            print("Social links created!")
        
        # Create sample projects
        if not Projects.query.first():
            projects_data = [
                {
                    "title": "Guesthouse/Hotel Management System",
                    "description": "Full-stack web app using Flask, PostgreSQL, Tailwind, HTMX, Alpine.js with guest check-in/out, room tracking, bookings, and invoice generation.",
                    "tech_stack": "Python, Flask, PostgreSQL, Tailwind, HTMX, Alpine.js",
                    "project_link": "#",
                    "github_link": "#",
                    "featured": True
                },
                {
                    "title": "WhatsApp-like Web Chat Application",
                    "description": "End-to-end encrypted messaging with AI features using Flask, Socket.IO, and WebRTC for voice/video calls.",
                    "tech_stack": "Python, Flask, Socket.IO, WebRTC, OpenAI API",
                    "project_link": "#",
                    "github_link": "#",
                    "featured": True
                },
                {
                    "title": "Manga Reading Website",
                    "description": "Web platform with user and admin modules using Flask/Django, PostgreSQL with authentication and role-based access control.",
                    "tech_stack": "Python, Flask, Django, PostgreSQL, HTML/CSS/JS",
                    "project_link": "#",
                    "github_link": "#",
                    "featured": True
                }
            ]
            
            for project in projects_data:
                db.session.add(Projects(**project))
            print("Sample projects created!")
        
        db.session.commit()
        print("✅ Database initialization completed successfully!")

if __name__ == '__main__':
    init_sample_data()
