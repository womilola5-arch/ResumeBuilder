/**
 * Resume Builder Core Logic
 */

// State Management
const state = {
    data: {
        template: 'modern',
        color: '#2563eb',
        fullName: '',
        jobTitle: '',
        email: '',
        phone: '',
        location: '',
        website: '',
        summary: '',
        skills: '',
        work: [],
        education: []
    }
};

// DOM Elements
const forms = {
    personal: document.getElementById('resumeForm'),
    template: document.getElementById('templateSelector'),
    color: document.getElementById('accentColor')
};
const previewContainer = document.getElementById('resumePreview');
const saveStatus = document.getElementById('saveStatus');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    render();
});

function setupEventListeners() {
    // Input Listeners with Auto-Save
    forms.personal.addEventListener('input', handleInput);
    forms.template.addEventListener('change', (e) => {
        state.data.template = e.target.value;
        saveData();
        render();
    });
    forms.color.addEventListener('input', (e) => {
        state.data.color = e.target.value;
        saveData();
        render();
    });
}

function handleInput(e) {
    const { name, value, dataset } = e.target;
    
    // Handle Work & Education Arrays
    if (dataset.section) {
        const index = dataset.index;
        const field = dataset.field;
        state.data[dataset.section][index][field] = value;
    } else if (name) {
        // Handle Top-Level Fields
        state.data[name] = value;
    }
    
    saveData();
    render();
}

// --- Dynamic Sections (Work/Education) ---

window.addExperience = function() {
    state.data.work.push({
        title: 'Job Title',
        company: 'Company Name',
        startDate: '2022',
        endDate: 'Present',
        description: 'Describe your responsibilities and achievements...'
    });
    saveData();
    renderEditor(); // Re-render editor inputs
    render();
}

window.addEducation = function() {
    state.data.education.push({
        school: 'University Name',
        degree: 'Degree / Major',
        gradDate: '2024'
    });
    saveData();
    renderEditor();
    render();
}

window.removeItem = function(section, index) {
    state.data[section].splice(index, 1);
    saveData();
    renderEditor();
    render();
}

function renderEditor() {
    // Render Work Inputs
    const workContainer = document.getElementById('experienceList');
    workContainer.innerHTML = state.data.work.map((job, index) => `
        <div class="dynamic-item">
            <button type="button" class="remove-item" onclick="removeItem('work', ${index})"><i class="fas fa-trash"></i></button>
            <div class="form-group">
                <input type="text" class="form-control" placeholder="Job Title" value="${job.title}" 
                    data-section="work" data-index="${index}" data-field="title">
            </div>
            <div class="form-group">
                <input type="text" class="form-control" placeholder="Company" value="${job.company}" 
                    data-section="work" data-index="${index}" data-field="company">
            </div>
            <div class="form-row">
                <input type="text" class="form-control" placeholder="Start" value="${job.startDate}" 
                    data-section="work" data-index="${index}" data-field="startDate">
                <input type="text" class="form-control" placeholder="End" value="${job.endDate}" 
                    data-section="work" data-index="${index}" data-field="endDate">
            </div>
            <div class="form-group" style="margin-top: 10px;">
                <textarea class="form-control" rows="3" placeholder="Description"
                    data-section="work" data-index="${index}" data-field="description">${job.description}</textarea>
            </div>
        </div>
    `).join('');

    // Render Education Inputs
    const eduContainer = document.getElementById('educationList');
    eduContainer.innerHTML = state.data.education.map((edu, index) => `
        <div class="dynamic-item">
            <button type="button" class="remove-item" onclick="removeItem('education', ${index})"><i class="fas fa-trash"></i></button>
            <div class="form-group">
                <input type="text" class="form-control" placeholder="School" value="${edu.school}" 
                    data-section="education" data-index="${index}" data-field="school">
            </div>
            <div class="form-group">
                <input type="text" class="form-control" placeholder="Degree" value="${edu.degree}" 
                    data-section="education" data-index="${index}" data-field="degree">
            </div>
            <div class="form-group">
                <input type="text" class="form-control" placeholder="Graduation Year" value="${edu.gradDate}" 
                    data-section="education" data-index="${index}" data-field="gradDate">
            </div>
        </div>
    `).join('');
}

// --- Rendering & Logic ---

function render() {
    const templateFunc = Templates[state.data.template] || Templates.modern;
    previewContainer.innerHTML = templateFunc(state.data, state.data.color);
}

// --- Persistence ---

function saveData() {
    localStorage.setItem('resumeData', JSON.stringify(state.data));
    showSaveStatus();
}

function loadData() {
    const saved = localStorage.getItem('resumeData');
    if (saved) {
        state.data = JSON.parse(saved);
        
        // Populate static fields
        Object.keys(state.data).forEach(key => {
            if (typeof state.data[key] === 'string' && forms.personal.elements[key]) {
                forms.personal.elements[key].value = state.data[key];
            }
        });
        
        // Set dropdowns
        forms.template.value = state.data.template;
        forms.color.value = state.data.color;

        // Render dynamic fields
        renderEditor();
    } else {
        // Add one empty field for better UX on first load
        addExperience();
        addEducation();
    }
}

function showSaveStatus() {
    saveStatus.classList.add('visible');
    setTimeout(() => saveStatus.classList.remove('visible'), 2000);
}

// --- Export & Features ---

window.printResume = function() {
    window.print();
}

window.downloadPDF = async function() {
    const element = document.getElementById('resumePreview');
    const originalWidth = element.style.width;
    
    // Temporarily fix width for high-res capture
    element.style.width = "210mm";
    
    // Show loading state
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

    try {
        const canvas = await html2canvas(element, {
            scale: 2, // High resolution
            useCORS: true,
            logging: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${state.data.fullName || 'Resume'}.pdf`);
        
    } catch (err) {
        console.error("PDF Gen Error:", err);
        alert("Error generating PDF. Please try printing to PDF instead.");
    } finally {
        element.style.width = originalWidth;
        btn.innerHTML = originalText;
    }
}

// AI Placeholder (Mock)
window.optimizeWithAI = function(field) {
    alert("Phase 2 Feature: This would call Claude API to optimize the " + field);
    // Real implementation would go here as per README
}
