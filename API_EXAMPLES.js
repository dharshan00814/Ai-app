// Example API Usage and Testing

// 1. UPLOAD A RESUME
async function uploadResume() {
    const formData = new FormData();
    const fileInput = document.getElementById('fileInput');
    
    for (let file of fileInput.files) {
        formData.append('resumes', file);
    }
    
    const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    console.log('Upload Response:', data);
}

// 2. ANALYZE A RESUME
async function analyzeResume(fileId) {
    const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId })
    });
    
    const data = await response.json();
    console.log('Analysis Response:', data);
    return data;
}

// 3. SEND TO PRINCIPAL
async function sendToPrincipal(candidateName, analysis) {
    const response = await fetch('http://localhost:3000/api/send-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            candidateName,
            analysis
        })
    });
    
    const data = await response.json();
    console.log('Send to Principal Response:', data);
    return data;
}

// 4. GET ALL RESULTS
async function getAllResults() {
    const response = await fetch('http://localhost:3000/api/results');
    const data = await response.json();
    console.log('All Results:', data);
    return data;
}

// 5. HEALTH CHECK
async function checkHealth() {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    console.log('System Health:', data);
    return data;
}

// EXAMPLE WORKFLOW
async function completeScreeningWorkflow() {
    console.log('Starting Resume Screening Workflow...\n');
    
    // Step 1: Check System Health
    console.log('Step 1: Checking system health...');
    await checkHealth();
    
    // Step 2: Upload Resume
    console.log('\nStep 2: Uploading resume...');
    const uploadResult = await uploadResume();
    
    // Step 3: Analyze Resume
    if (uploadResult.success && uploadResult.files.length > 0) {
        console.log('\nStep 3: Analyzing resume...');
        const analysisResult = await analyzeResume(uploadResult.files[0].id);
        
        // Step 4: If Approved, Send to Principal
        if (analysisResult.success && analysisResult.analysis.status === 'approved') {
            console.log('\nStep 4: Resume approved! Sending to principal...');
            await sendToPrincipal(
                analysisResult.analysis.candidateName,
                analysisResult.analysis
            );
        }
    }
    
    // Step 5: Get All Results
    console.log('\nStep 5: Fetching all results...');
    await getAllResults();
    
    console.log('\n✅ Workflow complete!');
}

// Export for use in other modules
module.exports = {
    uploadResume,
    analyzeResume,
    sendToPrincipal,
    getAllResults,
    checkHealth,
    completeScreeningWorkflow
};
