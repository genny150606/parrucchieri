document.addEventListener('DOMContentLoaded', async () => {
    const bookingForm = document.getElementById('bookingForm');
    if (!bookingForm) return;

    const serviceSelect = document.getElementById('bookingService');
    const submitBtn = bookingForm.querySelector('.btn-submit');

    // Fetch services from Supabase
    try {
        const { data: services, error } = await supabaseClient
            .from('products_services')
            .select('*')
            .order('name');

        if (error) throw error;

        // Populate select
        if (services && services.length > 0) {
            serviceSelect.innerHTML = '<option value="" disabled selected>Seleziona un servizio</option>';
            services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = `${service.name} — €${service.price}`;
                serviceSelect.appendChild(option);
            });
        }
    } catch (err) {
        console.error("Error fetching services:", err);
    }

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Invio in corso...';
        submitBtn.style.pointerEvents = 'none';

        const name = document.getElementById('bookingName').value;
        const phone = document.getElementById('bookingPhone').value;
        const email = document.getElementById('bookingEmail').value;
        const serviceId = document.getElementById('bookingService').value;
        const date = document.getElementById('bookingDate').value;
        const time = document.getElementById('bookingTime').value;
        const notes = document.getElementById('bookingNotes').value;

        try {
            const { error } = await supabaseClient
                .from('bookings')
                .insert([
                    {
                        customer_name: name,
                        customer_phone: phone,
                        customer_email: email,
                        service_id: serviceId,
                        booking_date: date,
                        booking_time: time,
                        notes: notes,
                        status: 'pending'
                    }
                ]);

            if (error) throw error;

            submitBtn.textContent = '✓ Prenotazione Confermata!';
            submitBtn.style.background = 'var(--color-success)';

            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
                submitBtn.style.pointerEvents = '';
                bookingForm.reset();
            }, 3000);

        } catch (err) {
            console.error("Error saving booking:", err);
            submitBtn.textContent = 'Errore. Riprova.';
            submitBtn.style.background = 'red';

            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
                submitBtn.style.pointerEvents = '';
            }, 3000);
        }
    });
});
