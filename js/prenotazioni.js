document.addEventListener('DOMContentLoaded', async () => {
    const bookingForm = document.getElementById('bookingForm');
    if (!bookingForm) return;

    const serviceSelect = document.getElementById('bookingService');
    const staffSelect = document.getElementById('bookingStaff');
    const submitBtn = bookingForm.querySelector('.btn-submit');

    // Fetch services and staff from Supabase
    try {
        const [servicesRes, staffRes] = await Promise.all([
            supabaseClient.from('products_services').select('*').order('name'),
            supabaseClient.from('staff').select('*').eq('is_active', true).order('name')
        ]);

        if (servicesRes.error) throw servicesRes.error;
        if (staffRes.error) throw staffRes.error;

        // Populate services
        if (servicesRes.data && servicesRes.data.length > 0) {
            serviceSelect.innerHTML = '<option value="" disabled selected>Seleziona un servizio</option>';
            servicesRes.data.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = `${service.name} — €${service.price}`;
                serviceSelect.appendChild(option);
            });
        }

        // Populate staff
        if (staffRes.data && staffRes.data.length > 0) {
            staffSelect.innerHTML = '<option value="" disabled selected>Scegli il tuo stylist</option>';
            staffRes.data.forEach(member => {
                const option = document.createElement('option');
                option.value = member.id;
                option.textContent = `${member.name} (${member.role})`;
                staffSelect.appendChild(option);
            });
        }
    } catch (err) {
        console.error("Error fetching initial data:", err);
    }

    const bookingDateInput = document.getElementById('bookingDate');
    const bookingTimeSelect = document.getElementById('bookingTime');

    // Add empty option at the top of time select if not present
    if (bookingTimeSelect && bookingTimeSelect.options[0].value !== "") {
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Seleziona un orario";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        bookingTimeSelect.insertBefore(defaultOption, bookingTimeSelect.firstChild);
    }

    const updateAvailability = async () => {
        const selectedDate = bookingDateInput.value;
        const selectedStaff = staffSelect.value;

        if (!selectedDate || !selectedStaff) return;

        try {
            const { data: bookings, error } = await supabaseClient
                .rpc('get_booked_times', {
                    p_date: selectedDate,
                    p_staff_id: selectedStaff
                });

            if (error) throw error;

            const bookedTimes = bookings.map(b => b.booked_time);

            Array.from(bookingTimeSelect.options).forEach(option => {
                if (!option.value) return;

                if (bookedTimes.includes(option.value)) {
                    option.disabled = true;
                    option.textContent = `${option.value} (Occupato)`;
                } else {
                    option.disabled = false;
                    option.textContent = option.value;
                }
            });

            const selectedOption = bookingTimeSelect.options[bookingTimeSelect.selectedIndex];
            if (selectedOption && selectedOption.disabled) {
                bookingTimeSelect.value = '';
            }

        } catch (err) {
            console.error("Error fetching booked times:", err);
        }
    };

    // Initialize Flatpickr for a custom experience
    let fp = null;
    if (bookingDateInput) {
        fp = flatpickr(bookingDateInput, {
            locale: "it",
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "j F Y",
            minDate: "today",
            animate: true,
            disableMobile: "true", // Force custom calendar on mobile for better UX
            disable: [
                function (date) {
                    // Disable Mondays (Lunedi)
                    return (date.getDay() === 1);
                }
            ],
            onChange: function (selectedDates, dateStr, instance) {
                updateAvailability();
            },
            onOpen: function (selectedDates, dateStr, instance) {
                // Add a subtle class for custom animations if needed
                instance.calendarContainer.classList.add('luxury-open');
            }
        });
    }

    // Handle staff change to disable occupied times
    if (staffSelect) {
        staffSelect.addEventListener('change', updateAvailability);
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
        const staffId = document.getElementById('bookingStaff').value;
        const date = document.getElementById('bookingDate').value;
        const time = document.getElementById('bookingTime').value;
        const notes = document.getElementById('bookingNotes').value;

        try {
            // The unique index handles double booking protection at the database level!
            const timeWithSeconds = time.length === 5 ? `${time}:00` : time;
            const { error: insertError } = await supabaseClient
                .from('bookings')
                .insert([
                    {
                        customer_name: name,
                        customer_phone: phone,
                        customer_email: email,
                        service_id: serviceId,
                        staff_id: staffId,
                        booking_date: date,
                        booking_time: timeWithSeconds,
                        notes: notes,
                        status: 'pending'
                    }
                ]);

            if (insertError) {
                if (insertError.code === '23505' || insertError.message.includes('unique_active_booking')) { // Postgres unique_violation
                    if (typeof window.showToast === 'function') {
                        window.showToast("L'orario selezionato non è più disponibile. Scegli un altro orario.", 'error');
                    } else {
                        alert("L'orario selezionato non è più disponibile. Scegli un altro orario.");
                    }
                    // Refresh time select options
                    document.getElementById('bookingDate').dispatchEvent(new Event('change'));

                    submitBtn.textContent = 'Errore. Orario occupato.';
                    submitBtn.style.background = 'red';

                    setTimeout(() => {
                        submitBtn.textContent = originalText;
                        submitBtn.style.background = '';
                        submitBtn.style.pointerEvents = '';
                    }, 3000);
                    return;
                }
                throw insertError;
            }

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
