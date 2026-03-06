/* js/style-advisor.js */
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadStage = document.getElementById('upload-stage');
    const previewStage = document.getElementById('preview-stage');
    const resultsStage = document.getElementById('results-stage');
    const imgPreview = document.getElementById('img-preview');
    const btnChange = document.getElementById('btn-change');
    const btnAnalyze = document.getElementById('btn-analyze');
    const loader = document.getElementById('analysis-loader');
    const analysisText = document.getElementById('analysis-text');

    let base64Image = null;

    // --- Upload Logic ---
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFile(file);
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    });

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imgPreview.src = e.target.result;
            base64Image = e.target.result.split(',')[1];
            uploadStage.style.display = 'none';
            previewStage.style.display = 'flex';
            resultsStage.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    btnChange.addEventListener('click', () => {
        uploadStage.style.display = 'block';
        previewStage.style.display = 'none';
        fileInput.value = '';
        base64Image = null;
    });

    // --- Analysis Logic ---
    btnAnalyze.addEventListener('click', async () => {
        if (!base64Image) return;

        btnAnalyze.disabled = true;
        btnChange.style.display = 'none';
        loader.style.display = 'block';
        resultsStage.style.display = 'none';

        try {
            const { data, error } = await supabaseClient.functions.invoke('gemini-style-advisor', {
                body: { image: base64Image }
            });

            if (error) throw error;

            if (data && data.content) {
                // Converto il markdown base in HTML semplice
                const formattedContent = data.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br>');

                analysisText.innerHTML = `<p>${formattedContent}</p>`;
                resultsStage.style.display = 'block';
                // Scroll to results
                resultsStage.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

        } catch (err) {
            console.error('Advisor Error:', err);
            alert("Si è verificato un errore durante l'analisi. Riprova con un'altra foto.");
        } finally {
            btnAnalyze.disabled = false;
            btnChange.style.display = 'block';
            loader.style.display = 'none';
        }
    });
});
