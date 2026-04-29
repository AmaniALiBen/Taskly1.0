document.addEventListener('DOMContentLoaded', () => {

   
    function showToast(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => toast.remove(), 500);
        }, 3500);
    }


    
    window.addNewItem = function(listId) {
        const list = document.getElementById(listId);
        const allInputs = list.querySelectorAll('.li-input');
        const lastInput = allInputs[allInputs.length - 1];

        if (lastInput && lastInput.value.trim() === "") {
            showToast("Please fill the current feature before adding a new one", "error");
            
            lastInput.classList.add('shake-input');
            lastInput.style.borderBottomColor = "#ef4444";
            
            setTimeout(() => {
                lastInput.classList.remove('shake-input');
            }, 400);
            
            lastInput.focus();
            return;
        }

        const li = document.createElement('li');
        li.style.display = "flex";
        li.style.alignItems = "center";
        
        li.innerHTML = `
            <input type="text" placeholder="Enter feature details..." class="li-input">
            <i class="fas fa-times del-item-icon" style="color:#ef4444; cursor:pointer; font-size:0.7rem; margin-left:10px" onclick="this.parentElement.remove()"></i>
        `;
        
        list.appendChild(li);
        const newInput = li.querySelector('input');
        newInput.focus();

        newInput.addEventListener('input', function() {
            this.style.borderBottomColor = "rgba(255, 255, 255, 0.05)";
        });
    };


   
    const imgInput = document.getElementById('imgInput');
    const previewContainer = document.getElementById('imagePreviewContainer');

    if(imgInput) {
        imgInput.addEventListener('change', function() {
            previewContainer.innerHTML = ''; 
            [...this.files].forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const div = document.createElement('div');
                        div.className = 'preview-sq-box';
                        div.style.backgroundImage = `url(${e.target.result})`;
                        
                        const del = document.createElement('div');
                        del.className = 'del-btn';
                        del.innerHTML = '<i class="fas fa-times"></i>';
                        del.onclick = () => div.remove();
                        
                        div.appendChild(del);
                        previewContainer.appendChild(div);
                    };
                    reader.readAsDataURL(file);
                }
            });
        });
    }


   
    const mainCat = document.getElementById('mainCategory');
    const subCat = document.getElementById('subCategory');

    if(mainCat) {
        mainCat.addEventListener('change', function() {
            const categories = {
                "design": ["Logo Design", "UX/UI Design", "Branding", "Illustration"],
                "coding": ["Web Development", "App Development", "Software Testing", "Databases"]
            };
            
            subCat.innerHTML = '<option value="" disabled selected>Select Sub-category</option>';
            
            if(categories[this.value]) {
                categories[this.value].forEach(item => {
                    const option = new Option(item, item.toLowerCase().replace(/\s/g, '-'));
                    subCat.add(option);
                });
            }
        });
    }


   
    const gigForm = document.getElementById('gigForm');
    
    if(gigForm) {
        gigForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const tiers = ['list-basic', 'list-standard', 'list-premium'];
            let isAllValid = true;

            for (const tierId of tiers) {
                const list = document.getElementById(tierId);
                const inputs = list.querySelectorAll('.li-input');
                let hasAtLeastOneFeature = false;
                let hasEmptyFields = false;

                inputs.forEach(input => {
                    if (input.value.trim() !== "") {
                        hasAtLeastOneFeature = true;
                        input.style.borderBottomColor = "rgba(255, 255, 255, 0.05)";
                    } else {
                        hasEmptyFields = true;
                        input.style.borderBottomColor = "#ef4444";
                    }
                });

                if (!hasAtLeastOneFeature) {
                    showToast(`The ${tierId.split('-')[1].toUpperCase()} package must have at least one feature`, "error");
                    isAllValid = false;
                    break;
                }

                if (hasEmptyFields) {
                    showToast("Please fill or remove empty feature fields before creating", "error");
                    isAllValid = false;
                    break;
                }
            }

            if (isAllValid) {
                showToast("Gig created successfully! Resetting fields...", "success");

                gigForm.reset();
                if(previewContainer) previewContainer.innerHTML = '';
                tiers.forEach(id => {
                    const list = document.getElementById(id);
                    list.innerHTML = `<li><input type="text" placeholder="Enter feature details..." class="li-input"></li>`;
                });
                if(subCat) subCat.innerHTML = '<option value="" disabled selected>Select Sub-category</option>';
            }

            const priceInputs = document.querySelectorAll('.price-input');
            let isPriceValid = true;

            priceInputs.forEach(input => {
                if (parseInt(input.value) <= 0 || input.value === "") {
                    isPriceValid = false;
                    input.parentElement.style.borderColor = "#ef4444"; 
                } else {
                    input.parentElement.style.borderColor = "rgba(255, 255, 255, 0.05)";
                }
            });

            if (!isPriceValid) {
                showToast("Price must be greater than $0", "error");
                return; 
            }
           
        });
    }

});

function toggleUnlimited(selectElement) {
    // الحصول على حقل الرقم الذي يسبق الاختيار مباشرة
    const numInput = selectElement.previousElementSibling;
    
    if (selectElement.value === 'unlimited') {
        numInput.classList.add('hidden');
        numInput.value = ''; // تفريغ القيمة
    } else {
        numInput.classList.remove('hidden');
        numInput.placeholder = 'No.';
    }
}
function goBack() {
    window.history.back();
}

