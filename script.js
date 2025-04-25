document.addEventListener('DOMContentLoaded', () => {
    // Éléments du DOM
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const imageList = document.getElementById('imageList');
    
    // Variables globales
    let images = [];
    
    // Événements pour le drag & drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    // Gestion du drop
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // Gestion du clic sur le bouton parcourir
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // Traitement des fichiers
    function handleFiles(files) {
        const validFiles = Array.from(files).filter(file => file.type.match('image.*'));
        
        if (validFiles.length === 0) {
            alert('Veuillez sélectionner uniquement des images.');
            return;
        }
        
        validFiles.forEach(file => {
            // Vérifier si l'image existe déjà (par nom)
            if (!images.some(img => img.name === file.name)) {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const imageObj = {
                        name: file.name,
                        data: e.target.result
                    };
                    
                    images.push(imageObj);
                    displayImage(imageObj, images.length - 1);
                    
                    updateButtons();
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Affichage des images
    function displayImage(imageObj, index) {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.dataset.index = index;
        
        const img = document.createElement('img');
        img.src = imageObj.data;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', () => removeImage(index));
        
        const imageName = document.createElement('div');
        imageName.className = 'image-name';
        imageName.textContent = imageObj.name;
        
        imageItem.appendChild(img);
        imageItem.appendChild(removeBtn);
        imageItem.appendChild(imageName);
        
        imageList.appendChild(imageItem);
    }
    
    // Suppression d'une image
    function removeImage(index) {
        images.splice(index, 1);
        refreshImageList();
        updateButtons();
    }
    
    // Rafraîchir la liste des images
    function refreshImageList() {
        imageList.innerHTML = '';
        images.forEach((imageObj, index) => {
            displayImage(imageObj, index);
        });
    }
    
    // Mise à jour de l'état des boutons
    function updateButtons() {
        if (images.length > 0) {
            generateBtn.disabled = false;
            clearBtn.disabled = false;
        } else {
            generateBtn.disabled = true;
            clearBtn.disabled = true;
        }
    }
    
    // Génération du PDF
    generateBtn.addEventListener('click', generatePDF);
    
    function generatePDF() {
        if (images.length === 0) {
            alert('Veuillez ajouter au moins une image.');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Fonction pour ajouter une image au PDF
        function addImageToPDF(index) {
            if (index >= images.length) {
                // Toutes les images ont été ajoutées, on sauvegarde le PDF
                doc.save('images_combinees.pdf');
                return;
            }
            
            const img = new Image();
            img.src = images[index].data;
            
            img.onload = function() {
                // Ajouter une nouvelle page pour chaque image sauf la première
                if (index > 0) {
                    doc.addPage();
                }
                
                // Calculer les dimensions pour ajuster l'image à la page
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                
                let imgWidth = img.width;
                let imgHeight = img.height;
                
                // Calculer le ratio pour ajuster l'image à la page
                const ratio = Math.min(
                    pageWidth / imgWidth,
                    pageHeight / imgHeight
                );
                
                imgWidth = imgWidth * ratio * 0.9; // 90% de la largeur disponible
                imgHeight = imgHeight * ratio * 0.9; // 90% de la hauteur disponible
                
                // Centrer l'image sur la page
                const x = (pageWidth - imgWidth) / 2;
                const y = (pageHeight - imgHeight) / 2;
                
                // Ajouter l'image au PDF
                doc.addImage(
                    img,
                    'JPEG',
                    x,
                    y,
                    imgWidth,
                    imgHeight
                );
                
                // Passer à l'image suivante
                addImageToPDF(index + 1);
            };
        }
        
        // Commencer le processus avec la première image
        addImageToPDF(0);
    }
    
    // Effacer toutes les images
    clearBtn.addEventListener('click', clearImages);
    
    function clearImages() {
        if (confirm('Êtes-vous sûr de vouloir supprimer toutes les images ?')) {
            images = [];
            imageList.innerHTML = '';
            updateButtons();
        }
    }
});
