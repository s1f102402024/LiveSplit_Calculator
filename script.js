// DOM Elements
const calculatorForm = document.getElementById('calculatorForm');
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const closeBtn = document.getElementById('closeBtn');
const results = document.getElementById('results');
const resultGrid = document.getElementById('resultGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const calculateBtn = document.querySelector('.calculate-btn');
const addBandBtn = document.getElementById('addBandBtn');
const bandGroupsContainer = document.getElementById('bandGroupsContainer');

// Form inputs
const rentalCostInput = document.getElementById('rentalCost');
const totalPerformersInput = document.getElementById('totalPerformers');

// Error message elements
const rentalCostError = document.getElementById('rentalCostError');
const totalPerformersError = document.getElementById('totalPerformersError');

// Band groups management
let bandGroupCounter = 0;
let bandGroups = [];

// Help Modal Functions
helpBtn.addEventListener('click', () => {
    helpModal.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    helpModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === helpModal) {
        helpModal.style.display = 'none';
    }
});

// Band Group Management Functions
function createBandGroup(bandNumber = 2, count = 0, rate = 10) {
    const groupId = `bandGroup_${bandGroupCounter++}`;
    
    const bandGroup = {
        id: groupId,
        bandNumber: bandNumber,
        count: count,
        rate: rate
    };
    
    bandGroups.push(bandGroup);
    
    const groupElement = document.createElement('div');
    groupElement.className = 'band-group';
    groupElement.id = groupId;
    
    groupElement.innerHTML = `
        <div class="band-group-header">
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="number" class="band-number-input" value="${bandNumber}" min="2" max="20" 
                       onchange="updateBandNumber('${groupId}', this.value)">
                <span style="color: #ff8000; font-weight: bold;">バンド出演</span>
            </div>
            <button type="button" class="remove-band-btn" onclick="removeBandGroup('${groupId}')">×</button>
        </div>
        <div class="input-row">
            <div class="input-group small">
                <label>出演者数</label>
                <input type="number" class="band-count-input" value="${count}" min="0" 
                       placeholder="例: 8" onchange="updateBandCount('${groupId}', this.value)">
            </div>
            <div class="input-group small">
                <label>追加料金率 (%)</label>
                <input type="number" class="band-rate-input" value="${rate}" min="0" 
                       placeholder="例: 10" onchange="updateBandRate('${groupId}', this.value)">
            </div>
        </div>
    `;
    
    bandGroupsContainer.appendChild(groupElement);
    updateOneBandCount();
    return groupId;
}

function removeBandGroup(groupId) {
    const groupElement = document.getElementById(groupId);
    if (groupElement) {
        groupElement.remove();
    }
    
    bandGroups = bandGroups.filter(group => group.id !== groupId);
    updateOneBandCount();
}

function updateBandNumber(groupId, value) {
    const group = bandGroups.find(g => g.id === groupId);
    if (group) {
        group.bandNumber = parseInt(value) || 2;
    }
    updateOneBandCount();
}

function updateBandCount(groupId, value) {
    const group = bandGroups.find(g => g.id === groupId);
    if (group) {
        group.count = parseInt(value) || 0;
    }
    updateOneBandCount();
}

function updateBandRate(groupId, value) {
    const group = bandGroups.find(g => g.id === groupId);
    if (group) {
        group.rate = parseFloat(value) || 0;
    }
}

// Add band group button event
addBandBtn.addEventListener('click', () => {
    // Find the next available band number
    const existingNumbers = bandGroups.map(g => g.bandNumber).sort((a, b) => a - b);
    let nextNumber = 2;
    
    for (let i = 0; i < existingNumbers.length; i++) {
        if (existingNumbers[i] === nextNumber) {
            nextNumber++;
        } else {
            break;
        }
    }
    
    const defaultRate = nextNumber === 2 ? 10 : (nextNumber - 1) * 10;
    createBandGroup(nextNumber, 0, defaultRate);
});

// Form Validation Functions
function validateInput(input, errorElement, fieldName) {
    const value = parseFloat(input.value);
    
    if (!input.value.trim()) {
        errorElement.textContent = `${fieldName}を入力してください`;
        input.style.borderColor = '#ff4080';
        return false;
    }
    
    if (isNaN(value) || value < 0) {
        errorElement.textContent = `${fieldName}は0以上の数値を入力してください`;
        input.style.borderColor = '#ff4080';
        return false;
    }
    
    errorElement.textContent = '';
    input.style.borderColor = '#0080ff';
    return true;
}

function validateForm() {
    let isValid = true;
    
    // Validate rental cost
    if (!validateInput(rentalCostInput, rentalCostError, 'ライブハウスレンタル料')) {
        isValid = false;
    }
    
    // Validate total performers
    if (!validateInput(totalPerformersInput, totalPerformersError, '出演者総数')) {
        isValid = false;
    }
    
    // Check if total performers matches the sum of band participants
    if (isValid) {
        const totalPerformers = parseInt(totalPerformersInput.value);
        const multiBandTotal = bandGroups.reduce((sum, group) => sum + group.count, 0);
        const oneBandCount = totalPerformers - multiBandTotal;
        
        if (oneBandCount < 0) {
            totalPerformersError.textContent = '複数バンド出演者の合計が総出演者数を超えています';
            totalPerformersInput.style.borderColor = '#ff4080';
            isValid = false;
        }
    }
    
    return isValid;
}

// Calculation Functions
function calculateCostDistribution() {
    const rentalCost = parseFloat(rentalCostInput.value);
    const totalPerformers = parseInt(totalPerformersInput.value);
    
    // Calculate single-band performers
    const multiBandTotal = bandGroups.reduce((sum, group) => sum + group.count, 0);
    const oneBandCount = totalPerformers - multiBandTotal;
    
    // Calculate total weighted units
    let totalWeightedUnits = oneBandCount * 1; // Single band multiplier is 1
    
    bandGroups.forEach(group => {
        const multiplier = 1 + (group.rate / 100);
        totalWeightedUnits += group.count * multiplier;
    });
    
    // Calculate base cost per unit
    const baseCostPerUnit = rentalCost / totalWeightedUnits;
    
    // Calculate costs for each category
    const results = {
        oneBand: {
            count: oneBandCount,
            costPerPerson: baseCostPerUnit,
            totalCost: baseCostPerUnit * oneBandCount,
            rate: 0,
            bandNumber: 1
        },
        multiBands: [],
        totalCost: rentalCost,
        totalPerformers: totalPerformers
    };
    
    bandGroups.forEach(group => {
        if (group.count > 0) {
            const multiplier = 1 + (group.rate / 100);
            const costPerPerson = baseCostPerUnit * multiplier;
            
            results.multiBands.push({
                bandNumber: group.bandNumber,
                count: group.count,
                costPerPerson: costPerPerson,
                totalCost: costPerPerson * group.count,
                rate: group.rate
            });
        }
    });
    
    // Sort multi-bands by band number
    results.multiBands.sort((a, b) => a.bandNumber - b.bandNumber);
    
    return results;
}

// Round to nearest 100 yen function
function roundToHundreds(amount) {
    return Math.round(amount / 100) * 100;
}

// Adjust amounts to ensure total meets or exceeds rental cost
function adjustAmountsToMeetTarget(results, targetAmount) {
    const categories = [];
    
    // Collect all categories with participants
    if (results.oneBand.count > 0) {
        categories.push({
            type: 'oneBand',
            count: results.oneBand.count,
            originalAmount: results.oneBand.costPerPerson,
            roundedAmount: roundToHundreds(results.oneBand.costPerPerson)
        });
    }
    
    results.multiBands.forEach(band => {
        if (band.count > 0) {
            categories.push({
                type: 'multiBand',
                bandNumber: band.bandNumber,
                count: band.count,
                originalAmount: band.costPerPerson,
                roundedAmount: roundToHundreds(band.costPerPerson),
                rate: band.rate
            });
        }
    });
    
    // Calculate initial total with rounded amounts
    let currentTotal = categories.reduce((sum, cat) => sum + (cat.roundedAmount * cat.count), 0);
    let shortfall = targetAmount - currentTotal;
    
    // If we're already at or above target, return as is
    if (shortfall <= 0) {
        return categories;
    }
    
    // Distribute the shortfall proportionally, prioritizing larger groups
    categories.sort((a, b) => (b.count * b.originalAmount) - (a.count * a.originalAmount));
    
    while (shortfall > 0 && categories.length > 0) {
        for (let i = 0; i < categories.length && shortfall > 0; i++) {
            const category = categories[i];
            const increment = 100; // Increase by 100 yen increments
            const totalIncrement = increment * category.count;
            
            if (totalIncrement <= shortfall) {
                category.roundedAmount += increment;
                shortfall -= totalIncrement;
            }
        }
        
        // Prevent infinite loop
        if (shortfall > 0) {
            // Add remaining shortfall to the largest group
            const largestGroup = categories[0];
            const remainingPerPerson = Math.ceil(shortfall / largestGroup.count / 100) * 100;
            largestGroup.roundedAmount += remainingPerPerson;
            shortfall = 0;
        }
    }
    
    return categories;
}

// Store current calculation results globally
let currentResults = null;

// Display Results (original accurate amounts)
function displayResults(results) {
    currentResults = results; // Store for cleanup function
    resultGrid.innerHTML = '';
    
    // Color schemes for different band numbers
    const colorSchemes = [
        { class: 'one-band', color: '#0080ff' },
        { class: 'two-band', color: '#ff8000' },
        { class: 'three-band', color: '#ff0080' },
        { class: 'four-band', color: '#8000ff' },
        { class: 'five-band', color: '#00ff80' },
        { class: 'six-band', color: '#ff4080' },
        { class: 'seven-band', color: '#80ff00' },
        { class: 'eight-band', color: '#ff8080' }
    ];
    
    // Show single-band result if there are participants
    if (results.oneBand.count > 0) {
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${colorSchemes[0].class}`;
        
        resultItem.innerHTML = `
            <div class="result-label">1バンド出演</div>
            <div class="result-amount">¥${Math.round(results.oneBand.costPerPerson).toLocaleString()}</div>
            <div class="result-details">
                ${results.oneBand.count}人 × ¥${Math.round(results.oneBand.costPerPerson).toLocaleString()}<br>
                基本料金
            </div>
        `;
        
        resultGrid.appendChild(resultItem);
    }
    
    // Show multi-band results
    results.multiBands.forEach((band, index) => {
        const resultItem = document.createElement('div');
        const colorIndex = Math.min(band.bandNumber - 1, colorSchemes.length - 1);
        resultItem.className = `result-item ${colorSchemes[colorIndex].class}`;
        
        resultItem.innerHTML = `
            <div class="result-label">${band.bandNumber}バンド出演</div>
            <div class="result-amount">¥${Math.round(band.costPerPerson).toLocaleString()}</div>
            <div class="result-details">
                ${band.count}人 × ¥${Math.round(band.costPerPerson).toLocaleString()}<br>
                基本料金 + ${band.rate}%
            </div>
        `;
        
        resultGrid.appendChild(resultItem);
    });
    
    // Add summary information
    const summaryItem = document.createElement('div');
    summaryItem.className = 'result-item summary';
    summaryItem.style.borderColor = '#00ff80';
    summaryItem.style.boxShadow = '0 0 15px rgba(0, 255, 128, 0.3)';
    
    // Calculate total using displayed rounded amounts
    let totalCalculated = 0;
    if (results.oneBand.count > 0) {
        totalCalculated += Math.round(results.oneBand.costPerPerson) * results.oneBand.count;
    }
    results.multiBands.forEach(band => {
        totalCalculated += Math.round(band.costPerPerson) * band.count;
    });
    
    const difference = totalCalculated - results.totalCost;
    
    summaryItem.innerHTML = `
        <div class="result-label">合計確認</div>
        <div class="result-amount">¥${totalCalculated.toLocaleString()}</div>
        <div class="result-details">
            総出演者: ${results.totalPerformers}人<br>
            レンタル料: ¥${results.totalCost.toLocaleString()}<br>
            ${difference !== 0 ? `差額: ${difference > 0 ? '+' : ''}¥${difference.toLocaleString()}` : '完全一致'}
        </div>
    `;
    
    resultGrid.appendChild(summaryItem);
    
    // Show cleanup button
    const cleanupBtn = document.getElementById('cleanupBtn');
    cleanupBtn.style.display = 'flex';
}

// Display Cleaned Results (rounded to hundreds with target guarantee)
function displayCleanedResults(results) {
    const cleanedResultGrid = document.getElementById('cleanedResultGrid');
    cleanedResultGrid.innerHTML = '';
    
    // Get adjusted amounts that meet or exceed rental cost
    const adjustedCategories = adjustAmountsToMeetTarget(results, results.totalCost);
    
    // Color schemes for different band numbers
    const colorSchemes = [
        { class: 'one-band', color: '#0080ff' },
        { class: 'two-band', color: '#ff8000' },
        { class: 'three-band', color: '#ff0080' },
        { class: 'four-band', color: '#8000ff' },
        { class: 'five-band', color: '#00ff80' },
        { class: 'six-band', color: '#ff4080' },
        { class: 'seven-band', color: '#80ff00' },
        { class: 'eight-band', color: '#ff8080' }
    ];
    
    let totalWithRounding = 0;
    
    // Display adjusted results
    adjustedCategories.forEach(category => {
        const resultItem = document.createElement('div');
        
        if (category.type === 'oneBand') {
            resultItem.className = `result-item ${colorSchemes[0].class}`;
            resultItem.innerHTML = `
                <div class="result-label">1バンド出演</div>
                <div class="result-amount">¥${category.roundedAmount.toLocaleString()}</div>
                <div class="result-details">
                    ${category.count}人 × ¥${category.roundedAmount.toLocaleString()}<br>
                    基本料金（100の位で四捨五入）
                </div>
            `;
        } else {
            const colorIndex = Math.min(category.bandNumber - 1, colorSchemes.length - 1);
            resultItem.className = `result-item ${colorSchemes[colorIndex].class}`;
            resultItem.innerHTML = `
                <div class="result-label">${category.bandNumber}バンド出演</div>
                <div class="result-amount">¥${category.roundedAmount.toLocaleString()}</div>
                <div class="result-details">
                    ${category.count}人 × ¥${category.roundedAmount.toLocaleString()}<br>
                    基本料金 + ${category.rate}%（100の位で四捨五入）
                </div>
            `;
        }
        
        cleanedResultGrid.appendChild(resultItem);
        totalWithRounding += category.roundedAmount * category.count;
    });
    
    // Add summary information
    const summaryItem = document.createElement('div');
    summaryItem.className = 'result-item summary';
    summaryItem.style.borderColor = '#ffff00';
    summaryItem.style.boxShadow = '0 0 15px rgba(255, 255, 0, 0.3)';
    
    const difference = totalWithRounding - results.totalCost;
    const isAtLeastTarget = totalWithRounding >= results.totalCost;
    
    summaryItem.innerHTML = `
        <div class="result-label">クリーンアップ後合計</div>
        <div class="result-amount">¥${totalWithRounding.toLocaleString()}</div>
        <div class="result-details">
            総出演者: ${results.totalPerformers}人<br>
            元のレンタル料: ¥${results.totalCost.toLocaleString()}<br>
            差額: ${difference > 0 ? '+' : ''}¥${difference.toLocaleString()}<br>
            <span style="color: ${isAtLeastTarget ? '#00ff80' : '#ff4080'};">
                ${isAtLeastTarget ? '✓ レンタル料以上を確保' : '⚠ レンタル料未達'}
            </span>
        </div>
    `;
    
    cleanedResultGrid.appendChild(summaryItem);
    
    // Show cleaned results section
    const cleanedResults = document.getElementById('cleanedResults');
    cleanedResults.style.display = 'block';
    
    // Scroll to cleaned results
    cleanedResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Form Submit Handler
calculatorForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    calculateBtn.classList.add('loading');
    
    // Simulate calculation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
        // Calculate results
        const calculationResults = calculateCostDistribution();
        
        // Display results
        displayResults(calculationResults);
        results.classList.add('show');
        
        // Scroll to results
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        console.error('Calculation error:', error);
        alert('計算中にエラーが発生しました。入力値を確認してください。');
    } finally {
        // Hide loading state
        calculateBtn.classList.remove('loading');
    }
});

// Real-time validation
[rentalCostInput, totalPerformersInput].forEach(input => {
    input.addEventListener('input', () => {
        const errorElement = input.id === 'rentalCost' ? rentalCostError : totalPerformersError;
        const fieldName = input.id === 'rentalCost' ? 'ライブハウスレンタル料' : '出演者総数';
        
        if (input.value.trim()) {
            validateInput(input, errorElement, fieldName);
        } else {
            errorElement.textContent = '';
            input.style.borderColor = '#0080ff';
        }
        
        updateOneBandCount();
    });
});

// Auto-calculate single band count display
function updateOneBandCount() {
    const totalPerformers = parseInt(totalPerformersInput.value) || 0;
    const multiBandTotal = bandGroups.reduce((sum, group) => sum + group.count, 0);
    const oneBandCount = totalPerformers - multiBandTotal;
    
    // Update or create display element for single band count
    let oneBandDisplay = document.getElementById('oneBandDisplay');
    if (!oneBandDisplay) {
        oneBandDisplay = document.createElement('div');
        oneBandDisplay.id = 'oneBandDisplay';
        oneBandDisplay.style.cssText = `
            background: rgba(0, 128, 255, 0.1);
            border: 1px solid #0080ff;
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            color: #0080ff;
            font-weight: bold;
        `;
        
        const bandGroups = document.querySelector('.band-groups');
        bandGroups.appendChild(oneBandDisplay);
    }
    
    if (totalPerformers > 0) {
        if (oneBandCount >= 0) {
            oneBandDisplay.innerHTML = `
                <div style="font-size: 1.1rem; margin-bottom: 5px;">1バンド出演者数</div>
                <div style="font-size: 1.5rem;">${oneBandCount}人</div>
                <div style="font-size: 0.9rem; opacity: 0.8; margin-top: 5px;">
                    (総数 ${totalPerformers} - 複数バンド ${multiBandTotal})
                </div>
            `;
            oneBandDisplay.style.borderColor = '#0080ff';
            oneBandDisplay.style.color = '#0080ff';
        } else {
            oneBandDisplay.innerHTML = `
                <div style="font-size: 1.1rem; margin-bottom: 5px;">⚠️ 人数エラー</div>
                <div style="font-size: 1.2rem;">複数バンド出演者の合計が総数を超えています</div>
            `;
            oneBandDisplay.style.borderColor = '#ff4080';
            oneBandDisplay.style.color = '#ff4080';
        }
    } else {
        oneBandDisplay.innerHTML = `
            <div style="font-size: 1.1rem;">1バンド出演者数</div>
            <div style="font-size: 1.2rem; opacity: 0.6;">総出演者数を入力してください</div>
        `;
        oneBandDisplay.style.borderColor = '#0080ff';
        oneBandDisplay.style.color = '#0080ff';
    }
}

// Cleanup button event listener
document.getElementById('cleanupBtn').addEventListener('click', () => {
    if (currentResults) {
        displayCleanedResults(currentResults);
    }
});

// Initialize with default band groups
window.addEventListener('load', () => {
    // Create initial band groups
    createBandGroup(2, 0, 10); // 2 bands, 10% extra
    createBandGroup(3, 0, 20); // 3 bands, 20% extra
    
    updateOneBandCount();
});
