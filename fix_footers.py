import os

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define the new footer block
    new_footer = """    <footer class="footer">
        <div class="footer-grid">
            <div class="footer-brand">
                <a href="index.html" class="nav-logo">
                    <img src="images/logo.png" alt="Hair Love Logo" style="height: 40px; width: auto; margin-bottom: 1rem;">
                </a>
                <p>Hair Love Parrucchieri: L'eccellenza dell'hairstyling nel cuore di Napoli. Specialisti in BlondeMe, Keratina, allungamenti, pieghe e tagli.</p>
                <div class="footer-social">
                    <a href="#" class="social-icon" aria-label="Facebook"><span class="material-symbols-outlined">share</span></a>
                    <a href="#" class="social-icon" aria-label="Instagram"><span class="material-symbols-outlined">photo_camera</span></a>
                </div>
            </div>
            <div class="footer-col">
                <h4>Esplora</h4>
                <ul>
                    <li><a href="index.html">La Nostra Storia</a></li>
                    <li><a href="servizi.html">Servizi Esclusivi</a></li>
                    <li><a href="team.html">Stilisti Esperti</a></li>
                    <li><a href="contatti.html">Carte Regalo</a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h4>Orari di Apertura</h4>
                <ul>
                    <li>Lun: 09:00 - 19:30</li>
                    <li>Mar - Ven: 08:30 - 19:30</li>
                    <li>Sabato: 08:30 - 19:00</li>
                    <li>Domenica: Chiuso</li>
                </ul>
            </div>
            <div class="footer-col">
                <h4>Contattaci</h4>
                <div class="footer-contact-item">
                    <span class="material-symbols-outlined">location_on</span>
                    <span>Via S. Eligio, 36, 80133 Napoli NA</span>
                </div>
                <div class="footer-contact-item">
                    <span class="material-symbols-outlined">call</span>
                    <span>+39 393 244 2655</span>
                </div>
                <div class="footer-contact-item">
                    <span class="material-symbols-outlined">mail</span>
                    <span>info@hairloveparrucchieri.it</span>
                </div>
            </div>
        </div>
        <div class="footer-bottom" style="display:flex; flex-direction:column; gap:0.5rem; align-items:center;">
            <div style="display:flex; gap:1.5rem; flex-wrap:wrap; justify-content:center;">
                <span>© 2024 Hair Love Parrucchieri. Tutti i diritti riservati.</span>
                <span>P.IVA: 01234567890</span>
            </div>
            <div style="display:flex; gap:1rem;">
                <a href="privacy-policy.html" style="color:var(--text-muted); text-decoration:none; font-size:0.85rem; transition:0.3s;">Privacy & Cookie Policy</a>
                <a href="privacy-policy.html#termini" style="color:var(--text-muted); text-decoration:none; font-size:0.85rem; transition:0.3s;">Termini e Condizioni</a>
                <span style="font-size:0.8rem;">Designed with ♥ in Napoli</span>
            </div>
        </div>
    </footer>"""

    # Identify the footer block and replace it
    if '<footer class="footer">' in content and '</footer>' in content:
        start_idx = content.find('<footer class="footer">')
        end_idx = content.find('</footer>', start_idx) + len('</footer>')
        
        # Replace the entire block
        new_content = content[:start_idx] + new_footer + content[end_idx:]
        
        # General branding fixes for other parts of the page (nav, etc)
        new_content = new_content.replace('R&S <span>Parrucchieri</span>', '<img src="images/logo.png" alt="Hair Love Logo" style="height: 50px; width: auto;">')
        new_content = new_content.replace('R&S Parrucchieri', 'Hair Love Parrucchieri')
        new_content = new_content.replace('Via della Spiga, 15, Napoli', 'Via S. Eligio, 36, 80133 Napoli NA')
        new_content = new_content.replace('Via della Moda 12, Napoli (NA)', 'Via S. Eligio, 36, 80133 Napoli NA')
        new_content = new_content.replace('Via della Moda 12, 80100 Napoli (NA)', 'Via S. Eligio, 36, 80133 Napoli NA')
        new_content = new_content.replace('+39 02 123 4567', '+39 393 244 2655')
        new_content = new_content.replace('concierge@luxesalon.it', 'info@hairloveparrucchieri.it')
        new_content = new_content.replace('info@rs-parrucchieri.it', 'info@hairloveparrucchieri.it')

        # Fix internal opening hours if present (like in Sidebar)
        new_content = new_content.replace('<span class="hours-time hours-closed">Chiuso</span>', '<span class="hours-time">09:00 – 19:30</span>', 1) 
        new_content = new_content.replace('09:00 – 19:00', '08:30 – 19:30')
        new_content = new_content.replace('10:00 – 20:00', '08:30 – 19:30')
        new_content = new_content.replace('09:00 – 18:00', '08:30 – 19:00')

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed: {filepath}")

base_dir = r"f:\Parrucchiere"
for filename in os.listdir(base_dir):
    if filename.endswith(".html"):
        fix_file(os.path.join(base_dir, filename))
