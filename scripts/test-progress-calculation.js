// Test script to verify progress calculation logic
// This script tests the progress bar calculation logic for different company statuses

// Mock company data with different statuses
const testCompanies = [
    {
        _id: "1",
        companyName: "Test Company 1",
        status: "payment-processing",
        currentStep: "contact-details"
    },
    {
        _id: "2",
        companyName: "Test Company 2",
        status: "documentation-processing",
        currentStep: "company-details"
    },
    {
        _id: "3",
        companyName: "Test Company 3",
        status: "incorporation-processing",
        currentStep: "documentation"
    },
    {
        _id: "4",
        companyName: "Test Company 4",
        status: "completed",
        currentStep: "incorporate"
    },
    {
        _id: "5",
        companyName: "Test Company 5",
        status: "completed",
        currentStep: "documentation" // Even if currentStep is not the last, status completed should show 100%
    }
];

// Progress calculation function (AdminDashboard logic)
function calculateAdminProgress(company) {
    const currentStep = company.currentStep || 'payment-processing';
    const status = company.status || 'payment-processing';

    // If status is completed, show 100%
    if (status === 'completed') {
        return 100;
    }

    const stepMap = {
        'payment-processing': 1,
        'company-details': 2,
        'documentation': 3,
        'incorporation-processing': 4
    };
    const currentStepNumber = stepMap[currentStep] || 1;
    const percentage = Math.round((currentStepNumber / 4) * 100);
    return percentage;
}

// Progress calculation function (CustomerDashboard logic)
function calculateCustomerProgress(company) {
    const stepOrder = ["contact-details", "company-details", "documentation", "incorporate"];
    const status = company.status || 'payment-processing';

    // If status is completed, show 100%
    if (status === 'completed') {
        return 100;
    }

    let progressPercent = 0;
    const stepIdx = company.currentStep ? stepOrder.indexOf(company.currentStep) : -1;

    // Only count steps before the current step as completed
    if (stepIdx > 0 && stepIdx <= stepOrder.length) {
        progressPercent = (stepIdx / stepOrder.length) * 100;
    } else if (stepIdx === 0) {
        progressPercent = 0;
    } else if (stepIdx === stepOrder.length - 1) {
        progressPercent = 100;
    }

    return Math.round(progressPercent);
}

// Test the progress calculations
console.log("🧪 Testing Progress Calculation Logic\n");

testCompanies.forEach((company, index) => {
    const adminProgress = calculateAdminProgress(company);
    const customerProgress = calculateCustomerProgress(company);

    console.log(`📊 Company ${index + 1}: ${company.companyName}`);
    console.log(`   Status: ${company.status}`);
    console.log(`   Current Step: ${company.currentStep}`);
    console.log(`   Admin Progress: ${adminProgress}%`);
    console.log(`   Customer Progress: ${customerProgress}%`);
    console.log(`   ✅ Expected: ${company.status === 'completed' ? '100%' : 'Variable'}%`);
    console.log("");
});

// Test edge cases
console.log("🔍 Testing Edge Cases\n");

const edgeCases = [
    { status: "completed", currentStep: "contact-details", description: "Completed status with early step" },
    { status: "payment-processing", currentStep: "incorporate", description: "Early status with late step" },
    { status: "unknown", currentStep: "unknown", description: "Unknown status and step" },
    { status: "", currentStep: "", description: "Empty status and step" }
];

edgeCases.forEach((testCase, index) => {
    const adminProgress = calculateAdminProgress(testCase);
    const customerProgress = calculateCustomerProgress(testCase);

    console.log(`📊 Edge Case ${index + 1}: ${testCase.description}`);
    console.log(`   Status: "${testCase.status}"`);
    console.log(`   Current Step: "${testCase.currentStep}"`);
    console.log(`   Admin Progress: ${adminProgress}%`);
    console.log(`   Customer Progress: ${customerProgress}%`);
    console.log("");
});

console.log("✅ Progress calculation test completed!"); 