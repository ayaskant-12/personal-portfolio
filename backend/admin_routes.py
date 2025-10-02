from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for
from flask_login import login_required, current_user
from models import db, Projects, Skills, Bio, SocialLinks, ContactSubmission, Certifications, ToolsTechnologies, Education, LetsTalk
import os
from werkzeug.utils import secure_filename
from datetime import datetime  # Make sure this is imported for date handling

admin = Blueprint('admin', __name__)

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'svg'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@admin.route('/admin/dashboard')
@login_required
def dashboard():
    stats = {
        'projects_count': Projects.query.count(),
        'skills_count': Skills.query.count(),
        'certifications_count': Certifications.query.count(),
        'tools_count': ToolsTechnologies.query.count(),
        'education_count': Education.query.count(),
        'lets_talk_count': LetsTalk.query.count(),
        'unread_messages': ContactSubmission.query.filter_by(read=False).count(),
        'total_messages': ContactSubmission.query.count()
    }
    return render_template('admin/dashboard.html', stats=stats)

# Projects Management
@admin.route('/admin/projects')
@login_required
def manage_projects():
    projects = Projects.query.order_by(Projects.created_at.desc()).all()
    
    # Check if we're in edit mode
    edit_id = request.args.get('edit')
    edit_project = None
    if edit_id:
        try:
            edit_project = Projects.query.get(int(edit_id))
        except:
            flash('Invalid project ID', 'error')
    
    return render_template('admin/projects.html', projects=projects, edit_project=edit_project)

@admin.route('/admin/projects/add', methods=['POST'])
@login_required
def add_project():
    try:
        project = Projects(
            title=request.form.get('title'),
            description=request.form.get('description'),
            tech_stack=request.form.get('tech_stack'),
            project_link=request.form.get('project_link'),
            github_link=request.form.get('github_link'),
            featured=bool(request.form.get('featured'))
        )
        
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join('frontend/static/uploads/projects', filename)
                file.save(filepath)
                project.image_url = f'uploads/projects/{filename}'
        
        db.session.add(project)
        db.session.commit()
        flash('Project added successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Error adding project: ' + str(e), 'error')
    
    return redirect(url_for('admin.manage_projects'))

@admin.route('/admin/projects/<int:id>/edit', methods=['POST'])
@login_required
def edit_project(id):
    """Handle project updates"""
    project = Projects.query.get_or_404(id)
    
    try:
        # Get form data
        project.title = request.form.get('title', '').strip()
        project.description = request.form.get('description', '').strip()
        project.tech_stack = request.form.get('tech_stack', '').strip()
        project.project_link = request.form.get('project_link', '').strip()
        project.github_link = request.form.get('github_link', '').strip()
        
        # Handle featured checkbox
        featured_value = request.form.get('featured')
        project.featured = featured_value == 'true'
        
        # Handle file upload
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename != '' and allowed_file(file.filename):
                # Create upload directory if it doesn't exist
                upload_dir = os.path.join('frontend', 'static', 'uploads', 'projects')
                os.makedirs(upload_dir, exist_ok=True)
                
                # Generate secure filename
                filename = secure_filename(file.filename)
                # Add timestamp to avoid filename conflicts
                name, ext = os.path.splitext(filename)
                timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                filename = f"{name}_{timestamp}{ext}"
                
                # Save file
                filepath = os.path.join(upload_dir, filename)
                file.save(filepath)
                
                # Update project image URL
                project.image_url = f'uploads/projects/{filename}'
                
                flash(f'Project image updated: {filename}', 'success')
        
        # Update timestamp
        project.updated_at = datetime.utcnow()
        
        db.session.commit()
        flash('Project updated successfully!', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash(f'Error updating project: {str(e)}', 'error')
        # Return to edit form with error
        return render_template('admin/edit_project.html', project=project)
    
    return redirect(url_for('admin.manage_projects'))

@admin.route('/admin/projects/<int:id>/delete')
@login_required
def delete_project(id):
    project = Projects.query.get_or_404(id)
    try:
        db.session.delete(project)
        db.session.commit()
        flash('Project deleted successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Error deleting project: ' + str(e), 'error')
    
    return redirect(url_for('admin.manage_projects'))

# Skills Management
@admin.route('/admin/skills')
@login_required
def manage_skills():
    skills = Skills.query.order_by(Skills.display_order).all()
    
    # Check if we're in edit mode
    edit_id = request.args.get('edit')
    edit_skill = None
    if edit_id:
        try:
            edit_skill = Skills.query.get(int(edit_id))
        except:
            flash('Invalid skill ID', 'error')
    
    return render_template('admin/skills.html', skills=skills, edit_skill=edit_skill)

@admin.route('/admin/skills/add', methods=['POST'])
@login_required
def add_skill():
    try:
        skill = Skills(
            skill_name=request.form.get('skill_name'),
            proficiency_level=request.form.get('proficiency_level'),
            category=request.form.get('category'),
            icon_class=request.form.get('icon_class'),
            display_order=request.form.get('display_order', 0)
        )
        db.session.add(skill)
        db.session.commit()
        flash('Skill added successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Error adding skill: ' + str(e), 'error')
    
    return redirect(url_for('admin.manage_skills'))

@admin.route('/admin/skills/<int:id>/edit', methods=['POST'])
@login_required
def edit_skill(id):
    skill = Skills.query.get_or_404(id)
    try:
        skill.skill_name = request.form.get('skill_name', '').strip()
        skill.proficiency_level = int(request.form.get('proficiency_level', 0))
        skill.category = request.form.get('category', '').strip()
        skill.icon_class = request.form.get('icon_class', '').strip()
        skill.display_order = int(request.form.get('display_order', 0))
        
        db.session.commit()
        flash('Skill updated successfully!', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash(f'Error updating skill: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_skills'))

@admin.route('/admin/skills/<int:id>/delete')
@login_required
def delete_skill(id):
    skill = Skills.query.get_or_404(id)
    try:
        db.session.delete(skill)
        db.session.commit()
        flash('Skill deleted successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Error deleting skill: ' + str(e), 'error')
    
    return redirect(url_for('admin.manage_skills'))

# Bio Management
@admin.route('/admin/bio')
@login_required
def manage_bio():
    bio = Bio.query.first()
    social_links = SocialLinks.query.order_by(SocialLinks.display_order).all()
    
    # Check if we're editing a social link
    edit_social_id = request.args.get('edit_social')
    edit_social = None
    if edit_social_id:
        try:
            edit_social = SocialLinks.query.get(int(edit_social_id))
        except:
            flash('Invalid social link ID', 'error')
    
    return render_template('admin/bio.html', bio=bio, social_links=social_links, edit_social=edit_social)

@admin.route('/admin/bio/update', methods=['POST'])
@login_required
def update_bio():
    bio = Bio.query.first()
    if not bio:
        bio = Bio()
    
    try:
        bio.name = request.form.get('name')
        bio.about_me = request.form.get('about_me')
        bio.tagline = request.form.get('tagline')
        bio.email = request.form.get('email')
        bio.phone = request.form.get('phone')
        bio.location = request.form.get('location')
        bio.resume_url = request.form.get('resume_url')
        
        if 'profile_image' in request.files:
            file = request.files['profile_image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join('frontend/static/uploads/profile', filename)
                file.save(filepath)
                bio.profile_image = f'uploads/profile/{filename}'
        
        if not bio.id:
            db.session.add(bio)
        db.session.commit()
        flash('Bio updated successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Error updating bio: ' + str(e), 'error')
    
    return redirect(url_for('admin.manage_bio'))

# Social Links Management
@admin.route('/admin/social/add', methods=['POST'])
@login_required
def add_social_link():
    try:
        social_link = SocialLinks(
            platform=request.form.get('platform'),
            url=request.form.get('url'),
            icon_class=request.form.get('icon_class'),
            display_order=request.form.get('display_order', 0)
        )
        db.session.add(social_link)
        db.session.commit()
        flash('Social link added successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Error adding social link: ' + str(e), 'error')
    
    return redirect(url_for('admin.manage_bio'))

# Messages Management
@admin.route('/admin/messages')
@login_required
def manage_messages():
    messages = ContactSubmission.query.order_by(ContactSubmission.created_at.desc()).all()
    return render_template('admin/messages.html', messages=messages)

@admin.route('/admin/messages/<int:id>/mark-read')
@login_required
def mark_message_read(id):
    message = ContactSubmission.query.get_or_404(id)
    try:
        message.read = True
        db.session.commit()
        flash('Message marked as read!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Error updating message: ' + str(e), 'error')
    
    return redirect(url_for('admin.manage_messages'))

@admin.route('/admin/messages/<int:id>/delete')
@login_required
def delete_message(id):
    message = ContactSubmission.query.get_or_404(id)
    try:
        db.session.delete(message)
        db.session.commit()
        flash('Message deleted successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Error deleting message: ' + str(e), 'error')
    
    return redirect(url_for('admin.manage_messages'))

@admin.route('/admin/projects/<int:id>/edit', methods=['GET'])
@login_required
def edit_project_form(id):
    """Display the edit project form"""
    project = Projects.query.get_or_404(id)
    return render_template('admin/edit_project.html', project=project)

@admin.route('/admin/social/<int:id>/edit', methods=['POST'])
@login_required
def edit_social_link(id):
    social_link = SocialLinks.query.get_or_404(id)
    try:
        social_link.platform = request.form.get('platform', '').strip()
        social_link.url = request.form.get('url', '').strip()
        social_link.icon_class = request.form.get('icon_class', '').strip()
        social_link.display_order = int(request.form.get('display_order', 0))
        
        db.session.commit()
        flash('Social link updated successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error updating social link: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_bio'))

@admin.route('/admin/social/<int:id>/delete')
@login_required
def delete_social_link(id):
    social_link = SocialLinks.query.get_or_404(id)
    try:
        db.session.delete(social_link)
        db.session.commit()
        flash('Social link deleted successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting social link: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_bio'))

# Add these routes to admin_routes.py

# ===== CERTIFICATIONS =====
@admin.route('/admin/certifications')
@login_required
def manage_certifications():
    certifications = Certifications.query.order_by(Certifications.issue_date.desc()).all()
    
    edit_id = request.args.get('edit')
    edit_certification = None
    if edit_id:
        try:
            edit_certification = Certifications.query.get(int(edit_id))
        except:
            flash('Invalid certification ID', 'error')
    
    return render_template('admin/certifications.html', 
                         certifications=certifications, 
                         edit_certification=edit_certification)

@admin.route('/admin/certifications/add', methods=['POST'])
@login_required
def add_certification():
    try:
        issue_date = datetime.strptime(request.form.get('issue_date'), '%Y-%m-%d').date() if request.form.get('issue_date') else None
        expiry_date = datetime.strptime(request.form.get('expiry_date'), '%Y-%m-%d').date() if request.form.get('expiry_date') else None
        
        certification = Certifications(
            title=request.form.get('title', '').strip(),
            issuing_organization=request.form.get('issuing_organization', '').strip(),
            issue_date=issue_date,
            expiry_date=expiry_date,
            credential_id=request.form.get('credential_id', '').strip(),
            credential_url=request.form.get('credential_url', '').strip(),
            description=request.form.get('description', '').strip()
        )
        
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                upload_dir = os.path.join('frontend', 'static', 'uploads', 'certifications')
                os.makedirs(upload_dir, exist_ok=True)
                
                name, ext = os.path.splitext(filename)
                timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                filename = f"{name}_{timestamp}{ext}"
                
                filepath = os.path.join(upload_dir, filename)
                file.save(filepath)
                certification.image_url = f'uploads/certifications/{filename}'
        
        db.session.add(certification)
        db.session.commit()
        flash('Certification added successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error adding certification: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_certifications'))

@admin.route('/admin/certifications/<int:id>/edit', methods=['POST'])
@login_required
def edit_certification(id):
    certification = Certifications.query.get_or_404(id)
    try:
        certification.title = request.form.get('title', '').strip()
        certification.issuing_organization = request.form.get('issuing_organization', '').strip()
        
        if request.form.get('issue_date'):
            certification.issue_date = datetime.strptime(request.form.get('issue_date'), '%Y-%m-%d').date()
        
        if request.form.get('expiry_date'):
            certification.expiry_date = datetime.strptime(request.form.get('expiry_date'), '%Y-%m-%d').date()
        else:
            certification.expiry_date = None
            
        certification.credential_id = request.form.get('credential_id', '').strip()
        certification.credential_url = request.form.get('credential_url', '').strip()
        certification.description = request.form.get('description', '').strip()
        
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                upload_dir = os.path.join('frontend', 'static', 'uploads', 'certifications')
                os.makedirs(upload_dir, exist_ok=True)
                
                name, ext = os.path.splitext(filename)
                timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                filename = f"{name}_{timestamp}{ext}"
                
                filepath = os.path.join(upload_dir, filename)
                file.save(filepath)
                certification.image_url = f'uploads/certifications/{filename}'
        
        db.session.commit()
        flash('Certification updated successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error updating certification: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_certifications'))

@admin.route('/admin/certifications/<int:id>/delete')
@login_required
def delete_certification(id):
    certification = Certifications.query.get_or_404(id)
    try:
        db.session.delete(certification)
        db.session.commit()
        flash('Certification deleted successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting certification: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_certifications'))

# ===== TOOLS & TECHNOLOGIES =====
@admin.route('/admin/tools')
@login_required
def manage_tools():
    tools = ToolsTechnologies.query.order_by(ToolsTechnologies.display_order).all()
    
    edit_id = request.args.get('edit')
    edit_tool = None
    if edit_id:
        try:
            edit_tool = ToolsTechnologies.query.get(int(edit_id))
        except:
            flash('Invalid tool ID', 'error')
    
    return render_template('admin/tools.html', tools=tools, edit_tool=edit_tool)

@admin.route('/admin/tools/add', methods=['POST'])
@login_required
def add_tool():
    try:
        tool = ToolsTechnologies(
            name=request.form.get('name', '').strip(),
            category=request.form.get('category', '').strip(),
            icon_class=request.form.get('icon_class', '').strip(),
            proficiency_level=int(request.form.get('proficiency_level', 0)),
            display_order=int(request.form.get('display_order', 0)),
            is_featured=bool(request.form.get('is_featured'))
        )
        
        db.session.add(tool)
        db.session.commit()
        flash('Tool added successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error adding tool: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_tools'))

@admin.route('/admin/tools/<int:id>/edit', methods=['POST'])
@login_required
def edit_tool(id):
    tool = ToolsTechnologies.query.get_or_404(id)
    try:
        tool.name = request.form.get('name', '').strip()
        tool.category = request.form.get('category', '').strip()
        tool.icon_class = request.form.get('icon_class', '').strip()
        tool.proficiency_level = int(request.form.get('proficiency_level', 0))
        tool.display_order = int(request.form.get('display_order', 0))
        tool.is_featured = bool(request.form.get('is_featured'))
        
        db.session.commit()
        flash('Tool updated successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error updating tool: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_tools'))

@admin.route('/admin/tools/<int:id>/delete')
@login_required
def delete_tool(id):
    tool = ToolsTechnologies.query.get_or_404(id)
    try:
        db.session.delete(tool)
        db.session.commit()
        flash('Tool deleted successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting tool: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_tools'))

# ===== EDUCATION =====
@admin.route('/admin/education')
@login_required
def manage_education():
    education = Education.query.order_by(Education.start_date.desc()).all()
    
    edit_id = request.args.get('edit')
    edit_education = None
    if edit_id:
        try:
            edit_education = Education.query.get(int(edit_id))
        except:
            flash('Invalid education ID', 'error')
    
    return render_template('admin/education.html', education=education, edit_education=edit_education)

@admin.route('/admin/education/add', methods=['POST'])
@login_required
def add_education():
    try:
        start_date = datetime.strptime(request.form.get('start_date'), '%Y-%m-%d').date() if request.form.get('start_date') else None
        end_date = datetime.strptime(request.form.get('end_date'), '%Y-%m-%d').date() if request.form.get('end_date') else None
        
        education = Education(
            degree=request.form.get('degree', '').strip(),
            institution=request.form.get('institution', '').strip(),
            location=request.form.get('location', '').strip(),
            start_date=start_date,
            end_date=end_date,
            current=bool(request.form.get('current')),
            description=request.form.get('description', '').strip(),
            grade=request.form.get('grade', '').strip()
        )
        
        db.session.add(education)
        db.session.commit()
        flash('Education added successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error adding education: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_education'))

@admin.route('/admin/education/<int:id>/edit', methods=['POST'])
@login_required
def edit_education(id):
    education = Education.query.get_or_404(id)
    try:
        education.degree = request.form.get('degree', '').strip()
        education.institution = request.form.get('institution', '').strip()
        education.location = request.form.get('location', '').strip()
        
        if request.form.get('start_date'):
            education.start_date = datetime.strptime(request.form.get('start_date'), '%Y-%m-%d').date()
        
        if request.form.get('end_date'):
            education.end_date = datetime.strptime(request.form.get('end_date'), '%Y-%m-%d').date()
        else:
            education.end_date = None
            
        education.current = bool(request.form.get('current'))
        education.description = request.form.get('description', '').strip()
        education.grade = request.form.get('grade', '').strip()
        
        db.session.commit()
        flash('Education updated successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error updating education: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_education'))

@admin.route('/admin/education/<int:id>/delete')
@login_required
def delete_education(id):
    education = Education.query.get_or_404(id)
    try:
        db.session.delete(education)
        db.session.commit()
        flash('Education deleted successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting education: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_education'))

# ===== LET'S TALK =====
@admin.route('/admin/lets-talk')
@login_required
def manage_lets_talk():
    lets_talk_items = LetsTalk.query.order_by(LetsTalk.display_order).all()
    
    edit_id = request.args.get('edit')
    edit_lets_talk = None
    if edit_id:
        try:
            edit_lets_talk = LetsTalk.query.get(int(edit_id))
        except:
            flash('Invalid Let\'s Talk item ID', 'error')
    
    return render_template('admin/lets_talk.html', lets_talk_items=lets_talk_items, edit_lets_talk=edit_lets_talk)

@admin.route('/admin/lets-talk/add', methods=['POST'])
@login_required
def add_lets_talk():
    try:
        lets_talk = LetsTalk(
            title=request.form.get('title', '').strip(),
            description=request.form.get('description', '').strip(),
            contact_info=request.form.get('contact_info', '').strip(),
            icon_class=request.form.get('icon_class', '').strip(),
            display_order=int(request.form.get('display_order', 0)),
            is_active=bool(request.form.get('is_active'))
        )
        
        db.session.add(lets_talk)
        db.session.commit()
        flash('Let\'s Talk item added successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error adding Let\'s Talk item: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_lets_talk'))

@admin.route('/admin/lets-talk/<int:id>/edit', methods=['POST'])
@login_required
def edit_lets_talk(id):
    lets_talk = LetsTalk.query.get_or_404(id)
    try:
        lets_talk.title = request.form.get('title', '').strip()
        lets_talk.description = request.form.get('description', '').strip()
        lets_talk.contact_info = request.form.get('contact_info', '').strip()
        lets_talk.icon_class = request.form.get('icon_class', '').strip()
        lets_talk.display_order = int(request.form.get('display_order', 0))
        lets_talk.is_active = bool(request.form.get('is_active'))
        
        db.session.commit()
        flash('Let\'s Talk item updated successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error updating Let\'s Talk item: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_lets_talk'))

@admin.route('/admin/lets-talk/<int:id>/delete')
@login_required
def delete_lets_talk(id):
    lets_talk = LetsTalk.query.get_or_404(id)
    try:
        db.session.delete(lets_talk)
        db.session.commit()
        flash('Let\'s Talk item deleted successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting Let\'s Talk item: {str(e)}', 'error')
    
    return redirect(url_for('admin.manage_lets_talk'))
