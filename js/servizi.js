document.addEventListener('DOMContentLoaded', async () => {
    const servicesGrid = document.getElementById('servicesGrid');
    const servicesGridHome = document.getElementById('servicesGridHome');

    if (!servicesGrid && !servicesGridHome) return;

    // Fetch services from Supabase
    try {
        let query = supabaseClient.from('products_services').select('*').order('category').order('name');

        // If we are on the homepage, maybe limit to 3
        if (servicesGridHome) {
            query = supabaseClient.from('products_services').select('*').order('category').order('name').limit(3);
        }

        const { data: services, error } = await query;

        if (error) throw error;

        const targetGrid = servicesGrid || servicesGridHome;

        if (services && services.length > 0) {
            targetGrid.innerHTML = ''; // Clear loading text

            // Define some mapping for icons based on category/name for aesthetics
            const getIcon = (category, name) => {
                const text = (category + " " + name).toLowerCase();
                if (text.includes('taglio')) return 'content_cut';
                if (text.includes('colore') || text.includes('balayage')) return 'palette';
                if (text.includes('keratina') || text.includes('lisciante')) return 'auto_awesome';
                if (text.includes('styling') || text.includes('event')) return 'celebration';
                if (text.includes('spa') || text.includes('trattamento')) return 'spa';
                return 'health_and_beauty'; // Default
            };

            services.forEach(service => {
                const card = document.createElement('div');
                card.className = 'service-card fade-in';
                // Remove fade-in class temporarily to prevent observer issues if dynamically added after load, 
                // or we can manually add the 'visible' class so they show up immediately
                card.classList.add('visible');

                card.innerHTML = `
                    <div class="service-icon">
                        <span class="material-symbols-outlined">${getIcon(service.category, service.name)}</span>
                    </div>
                    <h3>${service.name}</h3>
                    <span style="display:inline-block; font-size: 0.8rem; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px; margin-bottom: 1rem; color: var(--color-accent);">${service.category}</span>
                    <p>${service.description || 'Trattamento esclusivo per la cura e la bellezza dei tuoi capelli.'}</p>
                    ${servicesGrid ? `<div class="service-price">€${service.price} <small>/ ${service.duration_minutes} min</small></div>` : ''}
                `;
                targetGrid.appendChild(card);
            });
        } else {
            targetGrid.innerHTML = '<p>Nessun servizio disponibile al momento.</p>';
        }
    } catch (err) {
        console.error("Error fetching services:", err);
        const targetGrid = servicesGrid || servicesGridHome;
        targetGrid.innerHTML = '<p style="color:red">Errore nel caricamento dei servizi. Riprova più tardi.</p>';
    }
});
