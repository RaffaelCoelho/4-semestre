document.addEventListener('DOMContentLoaded', function() {
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    const createAccountBtn = document.getElementById('create-account');
    const loginForm = document.getElementById('login-form');
    const vehicleForm = document.getElementById('vehicle-form');
    const vehicleList = document.getElementById('vehicle-list');
    const vacanciesList = document.getElementById('vacancies-list');
    const printTicketBtn = document.getElementById('print-ticket');
    const printReportBtn = document.getElementById('print-report');

    let users = JSON.parse(localStorage.getItem('users')) || [];
    let vehicles = JSON.parse(localStorage.getItem('vehicles')) || [];
    let vacancies = JSON.parse(localStorage.getItem('vacancies')) || Array.from({ length: 10 }, () => ({ status: "disponível", vehicle: null }));

    createAccountBtn.addEventListener('click', function() {
        const username = prompt("Escolha um nome de usuário:");
        const password = prompt("Escolha uma senha:");
        users.push({ username, password });
        localStorage.setItem('users', JSON.stringify(users));
        alert("Conta criada com sucesso!");
    });

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            loginSection.style.display = 'none';
            mainSection.style.display = 'block';
            loadVehicles();
            loadVacancies();
        } else {
            alert("Usuário ou senha incorretos!");
        }
    });

    vehicleForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const color = document.getElementById('color').value;
        const model = document.getElementById('model').value;
        const plate = document.getElementById('plate').value;

        // Verifica se há vagas disponíveis
        const availableVacancy = vacancies.findIndex(v => v.status === "disponível");
        if (availableVacancy === -1) {
            alert("Não há vagas disponíveis!");
            return;
        }

        const newVehicle = { color, model, plate, entryTime: new Date(), total: 0, timer: null, paid: false };
        vehicles.push(newVehicle);
        vacancies[availableVacancy] = { status: "ocupada", vehicle: newVehicle };
        localStorage.setItem('vehicles', JSON.stringify(vehicles));
        localStorage.setItem('vacancies', JSON.stringify(vacancies));
        loadVehicles();
        loadVacancies();
        vehicleForm.reset();
    });

    function loadVehicles() {
        vehicleList.innerHTML = '';
        vehicles.forEach((vehicle, index) => {
            const div = document.createElement('div');
            div.className = 'vehicle-item';
            div.innerHTML = `
                <div class="vehicle-info">
                    <strong>Cor:</strong> ${vehicle.color}<br>
                    <strong>Modelo:</strong> ${vehicle.model}<br>
                    <strong>Placa:</strong> ${vehicle.plate}<br>
                    <strong>Valor:</strong> R$ <span class="vehicle-timer">${vehicle.total.toFixed(2)}</span>
                    ${vehicle.paid ? '<span class="payment-done">Pagamento efetuado</span>' : ''}
                </div>
                <div class="vehicle-actions">
                    <button class="edit-btn" onclick="editVehicle(${index})">Editar</button>
                    <button class="delete-btn" onclick="deleteVehicle(${index})">Excluir</button>
                    ${!vehicle.paid ? `<button class="pay-btn" onclick="payVehicle(${index})">Pagar</button>` : ''}
                </div>
            `;
            vehicleList.appendChild(div);

            // Inicia o contador se não estiver pausado e o pagamento não foi efetuado
            if (!vehicle.timer && !vehicle.paid) {
                startTimer(index);
            }
        });
    }

    function loadVacancies() {
        vacanciesList.innerHTML = '';
        vacancies.forEach((vacancy, index) => {
            const div = document.createElement('div');
            div.className = 'vacancy-item';
            div.innerHTML = `
                <div class="vacancy-info">
                    <strong>Vaga ${index + 1}:</strong>
                    <span class="status-${vacancy.status}">${vacancy.status}</span><br>
                    ${vacancy.vehicle ? `<strong>Veículo:</strong> ${vacancy.vehicle.plate}` : ''}
                </div>
                <div class="vacancy-actions">
                    <button onclick="changeVacancyStatus(${index})">Alterar Status</button>
                    ${vacancy.vehicle ? `<button onclick="reallocateVehicle(${index})">Realocar</button>` : ''}
                </div>
            `;
            vacanciesList.appendChild(div);
        });
    }

    function startTimer(index) {
        vehicles[index].timer = setInterval(() => {
            vehicles[index].total += 5; // Adiciona R$ 5,00 a cada 5 segundos
            localStorage.setItem('vehicles', JSON.stringify(vehicles));
            updateVehicleDisplay(index);
        }, 5000); // 5000ms = 5 segundos
    }

    function updateVehicleDisplay(index) {
        const vehicleDisplay = document.querySelectorAll('.vehicle-item')[index];
        if (vehicleDisplay) {
            const timerElement = vehicleDisplay.querySelector('.vehicle-timer');
            timerElement.textContent = vehicles[index].total.toFixed(2);
        }
    }

    window.deleteVehicle = function(index) {
        clearInterval(vehicles[index].timer); // Para o contador
        const vacancyIndex = vacancies.findIndex(v => v.vehicle?.plate === vehicles[index].plate);
        if (vacancyIndex !== -1) {
            vacancies[vacancyIndex] = { status: "disponível", vehicle: null }; // Libera a vaga
        }
        vehicles.splice(index, 1);
        localStorage.setItem('vehicles', JSON.stringify(vehicles));
        localStorage.setItem('vacancies', JSON.stringify(vacancies));
        loadVehicles();
        loadVacancies();
    };

    window.editVehicle = function(index) {
        const vehicle = vehicles[index];
        const newColor = prompt("Nova cor:", vehicle.color);
        const newModel = prompt("Novo modelo:", vehicle.model);
        const newPlate = prompt("Nova placa:", vehicle.plate);

        if (newColor && newModel && newPlate) {
            vehicles[index] = {
                ...vehicle,
                color: newColor,
                model: newModel,
                plate: newPlate
            };
            localStorage.setItem('vehicles', JSON.stringify(vehicles));
            loadVehicles();
        }
    };

    window.payVehicle = function(index) {
        const paymentMethod = prompt("Escolha a forma de pagamento (débito, crédito ou PIX):");
        if (paymentMethod && ["débito", "crédito", "pix"].includes(paymentMethod.toLowerCase())) {
            clearInterval(vehicles[index].timer); // Para o contador
            vehicles[index].paid = true; // Marca como pago

            // Libera a vaga ocupada pelo veículo
            const vacancyIndex = vacancies.findIndex(v => v.vehicle?.plate === vehicles[index].plate);
            if (vacancyIndex !== -1) {
                vacancies[vacancyIndex] = { status: "disponível", vehicle: null };
            }

            alert(`Pagamento de R$ ${vehicles[index].total.toFixed(2)} realizado com sucesso via ${paymentMethod}.`);
            localStorage.setItem('vehicles', JSON.stringify(vehicles));
            localStorage.setItem('vacancies', JSON.stringify(vacancies));
            loadVehicles();
            loadVacancies();
        } else {
            alert("Forma de pagamento inválida!");
        }
    };

    window.changeVacancyStatus = function(index) {
        const newStatus = prompt("Novo status da vaga (disponível, ocupada, indisponível, reservada):");
        if (newStatus && ["disponível", "ocupada", "indisponível", "reservada"].includes(newStatus.toLowerCase())) {
            vacancies[index].status = newStatus.toLowerCase();
            localStorage.setItem('vacancies', JSON.stringify(vacancies));
            loadVacancies();
        } else {
            alert("Status inválido!");
        }
    };

    window.reallocateVehicle = function(index) {
        const newVacancyIndex = prompt("Para qual vaga deseja realocar o veículo? (1 a 10):");
        if (newVacancyIndex >= 1 && newVacancyIndex <= 10 && vacancies[newVacancyIndex - 1].status === "disponível") {
            const vehicle = vacancies[index].vehicle;
            vacancies[index] = { status: "disponível", vehicle: null }; // Libera a vaga atual
            vacancies[newVacancyIndex - 1] = { status: "ocupada", vehicle }; // Ocupa a nova vaga
            localStorage.setItem('vacancies', JSON.stringify(vacancies));
            loadVacancies();
        } else {
            alert("Vaga inválida ou indisponível!");
        }
    };

    printTicketBtn.addEventListener('click', function() {
        const lastVehicle = vehicles[vehicles.length - 1];
        if (lastVehicle) {
            alert(`Ticket: Placa ${lastVehicle.plate}, Código: ${Math.random().toString(36).substr(2, 9)}`);
        } else {
            alert("Nenhum veículo cadastrado!");
        }
    });

    printReportBtn.addEventListener('click', function() {
        const report = vehicles.map(v => `Placa: ${v.plate}, Entrada: ${v.entryTime}, Valor: R$ ${v.total.toFixed(2)}`).join('\n');
        alert(`Relatório:\n${report}`);
    });
});
