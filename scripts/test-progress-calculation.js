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
    const currentStep = company.currentStep || 'contact-details';
    const status = company.status || 'payment-processing';

    // If status is completed, show 100%
    if (status === 'completed') {
        return 100;
    }

    // Calculate progress based on completed steps
    // When currentStep is "company-details", step 1 is completed (25%)
    // When currentStep is "documentation", step 2 is completed (50%)
    // When currentStep is "incorporate", step 3 is completed (75%)
    const completedStepsMap = {
        'contact-details': 0,  // No steps completed yet
        'company-details': 1,  // Step 1 completed (25%)
        'documentation': 2,    // Step 2 completed (50%)
        'incorporate': 3       // Step 3 completed (75%)
    };
    const completedSteps = completedStepsMap[currentStep] || 0;
    const percentage = Math.round((completedSteps / 4) * 100);
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

// Test specific user scenario
console.log("🎯 Testing User's Specific Scenario\n");

const userScenario = {
    description: "Customer completed step 1 (contact-details), moved to step 2 (company-details)",
    status: "payment-processing",
    currentStep: "company-details",
    expectedAdmin: 25,
    expectedCustomer: 25
};

const adminProgress = calculateAdminProgress(userScenario);
const customerProgress = calculateCustomerProgress(userScenario);

const adminPass = adminProgress === userScenario.expectedAdmin;
const customerPass = customerProgress === userScenario.expectedCustomer;

console.log(`📊 User Scenario: ${userScenario.description}`);
console.log(`   Status: "${userScenario.status}"`);
console.log(`   Current Step: "${userScenario.currentStep}"`);
console.log(`   Admin Progress: ${adminProgress}% ${adminPass ? '✅' : '❌'} (Expected: ${userScenario.expectedAdmin}%)`);
console.log(`   Customer Progress: ${customerProgress}% ${customerPass ? '✅' : '❌'} (Expected: ${userScenario.expectedCustomer}%)`);
console.log("");

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