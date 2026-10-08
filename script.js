        // ================= PAGINAÇÃO =================

        const ITEMS_PER_PAGE = 5;
        const CATALOG_ITEMS_PER_PAGE = 6;

        let activeCatalogStore = "bases";
        let activeCatalogPage = 1;
        let classificationHelpReturnFocus = null;
        let classificationHelpIndex = 0;

        function updateClassificationHelpCarousel() {
            const carousel = document.getElementById("classificationHelpCarousel");
            if (!carousel) return;

            const cards = [...carousel.children];
            if (!cards.length) return;

            const carouselLeft = carousel.getBoundingClientRect().left;
            classificationHelpIndex = cards.reduce((closestIndex, card, index) => {
                const cardLeft = card.getBoundingClientRect().left - carouselLeft + carousel.scrollLeft;
                const closestLeft = cards[closestIndex].getBoundingClientRect().left - carouselLeft + carousel.scrollLeft;
                return Math.abs(cardLeft - carousel.scrollLeft) < Math.abs(closestLeft - carousel.scrollLeft)
                    ? index
                    : closestIndex;
            }, 0);

            document.getElementById("classificationHelpPosition").textContent = `${classificationHelpIndex + 1} de ${cards.length}`;
            document.getElementById("classificationHelpPrevious").disabled = classificationHelpIndex === 0;
            document.getElementById("classificationHelpNext").disabled = classificationHelpIndex === cards.length - 1;
        }

        function navigateClassificationHelp(step) {
            const carousel = document.getElementById("classificationHelpCarousel");
            if (!carousel) return;

            const cards = [...carousel.children];
            classificationHelpIndex = Math.max(0, Math.min(classificationHelpIndex + step, cards.length - 1));
            const card = cards[classificationHelpIndex];
            const left = card.getBoundingClientRect().left - carousel.getBoundingClientRect().left + carousel.scrollLeft;
            carousel.scrollTo({ left, behavior: "smooth" });
            updateClassificationHelpCarousel();
        }

        function openClassificationHelp() {
            const modal = document.getElementById("classificationHelpModal");
            if (!modal) return;

            classificationHelpReturnFocus = document.activeElement;
            modal.classList.add("open");
            updateClassificationHelpCarousel();
            modal.querySelector(".modal-close").focus();
        }

        const classificationHelpCarousel = document.getElementById("classificationHelpCarousel");
        let classificationHelpDrag = null;

        classificationHelpCarousel.addEventListener("scroll", updateClassificationHelpCarousel, { passive: true });
        classificationHelpCarousel.addEventListener("pointerdown", event => {
            if (event.pointerType !== "mouse" || event.button !== 0) return;

            classificationHelpDrag = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startScrollLeft: classificationHelpCarousel.scrollLeft,
                moved: false
            };
            classificationHelpCarousel.setPointerCapture(event.pointerId);
        });

        classificationHelpCarousel.addEventListener("pointermove", event => {
            if (!classificationHelpDrag || event.pointerId !== classificationHelpDrag.pointerId) return;

            const dragDistance = event.clientX - classificationHelpDrag.startX;
            if (Math.abs(dragDistance) > 4) {
                classificationHelpDrag.moved = true;
                classificationHelpCarousel.classList.add("is-dragging");
                event.preventDefault();
            }

            if (classificationHelpDrag.moved) {
                classificationHelpCarousel.scrollLeft = classificationHelpDrag.startScrollLeft - dragDistance;
            }
        });

        function finishClassificationHelpDrag(event) {
            if (!classificationHelpDrag || event.pointerId !== classificationHelpDrag.pointerId) return;
            classificationHelpDrag = null;
            classificationHelpCarousel.classList.remove("is-dragging");
        }

        classificationHelpCarousel.addEventListener("pointerup", finishClassificationHelpDrag);
        classificationHelpCarousel.addEventListener("pointercancel", finishClassificationHelpDrag);

        function closeClassificationHelp() {
            const modal = document.getElementById("classificationHelpModal");
            if (!modal || !modal.classList.contains("open")) return;

            modal.classList.remove("open");
            if (classificationHelpReturnFocus && typeof classificationHelpReturnFocus.focus === "function") {
                classificationHelpReturnFocus.focus();
            }
            classificationHelpReturnFocus = null;
        }

        function openBackupModal() {
            document.getElementById("backupModal").classList.add("open");
        }

        function closeBackupModal() {
            document.getElementById("backupModal").classList.remove("open");
        }

        function openCatalogModal(store = "bases") {
            activeCatalogStore = store;
            activeCatalogPage = 1;
            resetCatalogEditor();

            document.querySelectorAll(".tab-btn").forEach(btn => {
                btn.classList.toggle("active", btn.getAttribute("data-store") === store);
            });

            document.getElementById("catalogModal").classList.add("open");
            renderCatalogModal();
        }

        function closeCatalogModal() {
            resetCatalogEditor();
            document.getElementById("catalogModal").classList.remove("open");
        }

        function changeCatalogTab(store) {
            activeCatalogStore = store;
            activeCatalogPage = 1;
            resetCatalogEditor();
            document.querySelectorAll(".tab-btn").forEach(btn => {
                btn.classList.toggle("active", btn.getAttribute("data-store") === store);
            });
            renderCatalogModal();
        }

        document.addEventListener("keydown", e => {
            if (e.key === "Escape") {
                closeBackupModal();
                closeCatalogModal();
                closeClassificationHelp();
                document.querySelectorAll(".multi-select-dropdown.open").forEach(dd => {
                    const container = dd.closest(".multi-select-container");
                    if (container) {
                        closeMultiSelectDropdown(container.id);
                    }
                });
            }

            const helpModal = document.getElementById("classificationHelpModal");
            if (e.key === "Tab" && helpModal && helpModal.classList.contains("open")) {
                const focusableElements = [...helpModal.querySelectorAll("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")];
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });

        document.addEventListener("click", e => {
            if (!e.target.closest(".multi-select-container")) {
                document.querySelectorAll(".multi-select-dropdown.open").forEach(dd => {
                    const container = dd.closest(".multi-select-container");
                    if (container) {
                        closeMultiSelectDropdown(container.id);
                    }
                });
            }
        });

        let currentPage = 1;

        let allMeals = [];
        let editingMealId = null;

        function toggleDashboard() {
            const panel = document.getElementById("dashboardPanel");
            const button = document.querySelector(".dashboard-toggle");
            const icon = document.querySelector(".toggle-icon");

            if (!panel || !button || !icon) return;

            const isOpen = panel.classList.toggle("open");
            button.setAttribute("aria-expanded", isOpen ? "true" : "false");
            button.querySelector("span:first-child").textContent = isOpen ? "Recolher" : "Expandir";
            icon.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";
        }

        function toggleDashboard() {
            const panel = document.getElementById("dashboardPanel");
            const button = document.querySelector(".dashboard-toggle");
            const icon = document.querySelector(".toggle-icon");

            if (!panel || !button || !icon) return;

            const isOpen = panel.classList.toggle("open");
            button.setAttribute("aria-expanded", isOpen ? "true" : "false");
            button.querySelector("span:first-child").textContent = isOpen ? "Recolher" : "Expandir";
            icon.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";
        }
        let activeMealFilter = "all";
        let activeMealClassification = "";
        let mealSearchTerm = "";
        let activeDateFilter = "";
        let selectedMonth = "current";
        // ================= DB =================
        let db;

        const request = indexedDB.open("foodDB", 7);

        request.onupgradeneeded = function (e) {
            db = e.target.result;

            ["meals", "bases", "proteins", "carbs", "freeMeals", "fruits", "salads"].forEach(s => {
                if (!db.objectStoreNames.contains(s)) {
                    db.createObjectStore(s, { keyPath: "id", autoIncrement: true });
                }
            });
        };

        request.onsuccess = async function (e) {
            db = e.target.result;

            setDefaultDate();
            await seedCatalogIfNeeded();
            loadCatalog();
            loadMeals();
        };

        // ================= SCORE =================
        const scoreMap = {
            muitoBoa: 1,
            muitoBoaFlexivel: 0.9,
            boa: 0.75,
            intermediaria: 0.5,
            podeMelhorar: 0.25,
            livre: 0
        };

        // ================= DATA =================
        function getBrazilDateString(date = new Date()) {
            const formatter = new Intl.DateTimeFormat("en-CA", {
                timeZone: "America/Sao_Paulo",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });

            const parts = formatter.formatToParts(date);
            const values = Object.fromEntries(
                parts.filter(part => part.type !== "literal").map(part => [part.type, part.value])
            );

            return `${values.year}-${values.month}-${values.day}`;
        }

        function getWeekRange(dateString) {
            const [year, month, day] = dateString.split("-").map(Number);
            const date = new Date(Date.UTC(year, month - 1, day));
            const dayOfWeek = date.getUTCDay();

            const start = new Date(date);
            start.setUTCDate(date.getUTCDate() - dayOfWeek);

            const end = new Date(start);
            end.setUTCDate(start.getUTCDate() + 6);

            return {
                start: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-${String(start.getUTCDate()).padStart(2, "0")}`,
                end: `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-${String(end.getUTCDate()).padStart(2, "0")}`
            };
        }

        function setDefaultDate() {
            const dateInput = document.getElementById("date");
            if (dateInput) {
                dateInput.value = getBrazilDateString();
            }
        }

        function getCurrentMonth() {
            return getBrazilDateString().slice(0, 7);
        }

        function formatMonthLabel(monthValue) {
            if (!monthValue) return "";
            const [year, month] = monthValue.split("-");
            const months = [
                "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
            ];
            const monthIndex = Number(month) - 1;
            return `${months[monthIndex] || month}/${year}`;
        }

        function filterMealsByMonth(month) {
            if (!month || month === "all") {
                return [...allMeals];
            }

            const effectiveMonth = month === "current" ? getCurrentMonth() : month;
            return allMeals.filter(meal => meal.date && meal.date.startsWith(effectiveMonth));
        }

        function loadAvailableMonths() {
            const monthFilter = document.getElementById("monthFilter");
            if (!monthFilter) return;

            const months = [...new Set(allMeals.filter(meal => meal.date).map(meal => meal.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
            const currentMonthValue = getCurrentMonth();

            monthFilter.innerHTML = "";
            monthFilter.appendChild(new Option("📅 Todos os períodos", "all"));
            monthFilter.appendChild(new Option("📅 Mês Atual", "current"));

            months.forEach(monthValue => {
                monthFilter.appendChild(new Option(formatMonthLabel(monthValue), monthValue));
            });

            if (selectedMonth === "all") {
                monthFilter.value = "all";
            } else if (selectedMonth === "current") {
                monthFilter.value = "current";
            } else if (months.includes(selectedMonth)) {
                monthFilter.value = selectedMonth;
            } else if (months.includes(currentMonthValue)) {
                selectedMonth = currentMonthValue;
                monthFilter.value = currentMonthValue;
            } else {
                selectedMonth = "current";
                monthFilter.value = "current";
            }
        }

        function changeMonthFilter(month) {
            selectedMonth = month === "current" ? "current" : month;
            currentPage = 1;
            refreshDashboard();
        }

        function refreshDashboard() {
            const filteredMeals = filterMealsByMonth(selectedMonth);
            render();
            dashboard(filteredMeals);
        }

        // ================= CATALOG INICIAL =================
        const initialCatalog = {
            bases: ["Arroz", "Feijão", "Pão Francês", "Torrada Integral"],
            proteins: [
                "Filé de Frango Grelhado",
                "Contra Filé Grelhado",
                "Ovos",
                "Ovos Mexidos",
                "Atum",
                "Sardinha",
                "Tilápia",
                "Salmão",
                "Queijo Mussarela",
                "Iogurte Zero",
                "Pasta de Amendoim"
            ],
            carbs: [
                "Macarrão",
                "Cereal",
                "Batata",
                "Batata Doce",
                "Batata Palito",
                "Purê de Batata",
                "Aveia"
            ],
            freeMeals: ["Hambúrguer", "Pizza", "Cachorro Quente", "Sorvete", "Bolo", "Chocolate", "Pastel",
                "Coxinha",
                "Croissant", "Pão de Queijo"],
            fruits: ["Banana",
                "Maçã",
                "Mamão",
                "Manga",
                "Uva",
                "Pera",
                "Morango",
                "Abacaxi",
                "Melancia",
                "Melão",
                "Kiwi",
                "Laranja",
                "Mexerica",
                "Limão"],
            salads: [
                "Alface",
                "Tomate",
                "Cenoura",
                "Pepino",
                "Beterraba",
                "Repolho",
                "Brócolis",
                "Couve-flor",
                "Rúcula",
                "Almeirão",
                "Acelga"
            ]
        };

        function seedCatalogIfNeeded() {
            return Promise.all(
                Object.entries(initialCatalog).map(([storeName, items]) =>
                    new Promise((resolve, reject) => {
                        const tx = db.transaction(storeName, "readwrite");
                        const store = tx.objectStore(storeName);
                        const countRequest = store.count();

                        countRequest.onsuccess = () => {
                            if (countRequest.result > 0) {
                                resolve();
                                return;
                            }

                            items.forEach(item => store.add({ name: item }));

                            tx.oncomplete = () => resolve();
                            tx.onerror = () => reject(tx.error);
                        };

                        countRequest.onerror = () => reject(countRequest.error);
                    })
                )
            );
        }

        // ================= CATALOG =================
        let editingCatalogItem = null;

        function escapeHtml(value) {
            return String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\"/g, "&quot;")
                .replace(/'/g, "&#39;");
        }

        function resetCatalogEditor() {
            editingCatalogItem = null;
            const input = document.getElementById("catalogItemInput");
            const addButton = document.getElementById("catalogItemAddButton");
            const cancelButton = document.getElementById("catalogItemCancelButton");

            if (input) input.value = "";
            if (addButton) addButton.innerHTML = "➕ Adicionar";
            if (cancelButton) cancelButton.style.display = "none";
        }

        function editCatalogItem(store, id, encodedName) {
            const name = decodeURIComponent(encodedName || "");
            editingCatalogItem = { store, id };
            const input = document.getElementById("catalogItemInput");
            const addButton = document.getElementById("catalogItemAddButton");
            const cancelButton = document.getElementById("catalogItemCancelButton");

            if (input) {
                input.value = name || "";
                input.focus();
            }

            if (addButton) addButton.innerHTML = "💾 Salvar";
            if (cancelButton) cancelButton.style.display = "inline-flex";
        }

        function cancelCatalogEdit() {
            resetCatalogEditor();
        }

        async function refreshCatalogAndMealSelectors() {
            await loadCatalog();
        }

        function addItemToStore(store, value) {
            const trimmedValue = value ? value.trim() : "";

            if (!trimmedValue) {
                alert("Por favor, digite um nome para o item.");
                return;
            }

            if (editingCatalogItem && editingCatalogItem.store === store) {
                const tx = db.transaction(store, "readwrite");
                const store_obj = tx.objectStore(store);
                store_obj.put({ id: editingCatalogItem.id, name: trimmedValue });

                tx.oncomplete = () => {
                    resetCatalogEditor();
                    refreshCatalogAndMealSelectors();
                };

                tx.onerror = () => {
                    alert("Erro ao atualizar item.");
                };
                return;
            }

            const tx = db.transaction(store, "readwrite");
            const store_obj = tx.objectStore(store);
            store_obj.add({ name: trimmedValue });

            tx.oncomplete = () => {
                resetCatalogEditor();
                refreshCatalogAndMealSelectors();
            };

            tx.onerror = () => {
                alert("Erro ao adicionar item.");
            };
        }


        const multiSelectState = {
            baseSelectContainer: [],
            proteinSelectContainer: [],
            carbSelectContainer: [],
            freeSelectContainer: [],
            fruitSelectContainer: [],
            saladSelectContainer: []
        };

        function getSelectedValues(containerId) {
            return multiSelectState[containerId] || [];
        }

        function setSelectedValues(containerId, values) {
            const normalized = Array.isArray(values) ? values : values ? [values] : [];
            multiSelectState[containerId] = normalized;
            updateMultiSelectButton(containerId);
        }

        function toggleMultiSelectDropdown(containerId) {
            const container = document.getElementById(containerId);
            const button = container.querySelector(".multi-select-button");
            const dropdown = container.querySelector(".multi-select-dropdown");

            document.querySelectorAll(".multi-select-dropdown.open").forEach(dd => {
                if (dd !== dropdown) {
                    dd.classList.remove("open");
                    dd.closest(".multi-select-container").querySelector(".multi-select-button").classList.remove("open");
                }
            });

            button.classList.toggle("open");
            dropdown.classList.toggle("open");
        }

        function closeMultiSelectDropdown(containerId) {
            const container = document.getElementById(containerId);
            const button = container.querySelector(".multi-select-button");
            const dropdown = container.querySelector(".multi-select-dropdown");
            button.classList.remove("open");
            dropdown.classList.remove("open");
        }

        function toggleMultiSelectOption(containerId, value) {
            const selected = multiSelectState[containerId] || [];
            const index = selected.indexOf(value);

            if (index > -1) {
                selected.splice(index, 1);
            } else {
                selected.push(value);
            }

            multiSelectState[containerId] = selected;
            updateMultiSelectButton(containerId);
        }

        function updateMultiSelectButton(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const button = container.querySelector(".multi-select-button .multi-select-button-text");
            const selected = multiSelectState[containerId] || [];

            if (button) {
                if (selected.length === 0) {
                    button.textContent = "— Nenhum —";
                } else if (selected.length === 1) {
                    button.textContent = selected[0];
                } else {
                    button.textContent = `${selected.length} itens selecionados`;
                }
            }

            const checkboxes = container.querySelectorAll("input[type='checkbox']");
            checkboxes.forEach(cb => {
                cb.checked = selected.includes(cb.value);
            });
        }

        function syncMultiSelectStateWithCatalog(containerId, items) {
            const availableNames = new Set((items || []).map(item => item.name).filter(Boolean));
            const currentSelection = multiSelectState[containerId] || [];
            const filteredSelection = currentSelection.filter(value => availableNames.has(value));

            if (filteredSelection.length !== currentSelection.length) {
                multiSelectState[containerId] = filteredSelection;
            }
        }

        function renderMultiSelectDropdown(storeName, containerId) {
            return new Promise(async (resolve) => {
                const items = await getCatalogItems(storeName);
                const container = document.getElementById(containerId);

                if (!container) {
                    resolve();
                    return;
                }

                syncMultiSelectStateWithCatalog(containerId, items);

                container.innerHTML = `
                    <button type="button" class="multi-select-button" onclick="toggleMultiSelectDropdown('${containerId}')">
                        <span class="multi-select-button-text">— Nenhum —</span>
                        <span class="multi-select-arrow">▼</span>
                    </button>
                    <div class="multi-select-dropdown">
                        ${items.map(item => `
                            <div class="multi-select-option">
                                <input type="checkbox" id="${containerId}_${item.id}" value="${item.name}" onchange="toggleMultiSelectOption('${containerId}', '${item.name}')">
                                <label for="${containerId}_${item.id}">${item.name}</label>
                            </div>
                        `).join("")}
                    </div>
                `;

                updateMultiSelectButton(containerId);
                resolve();
            });
        }

        function normalizeValues(value) {
            if (Array.isArray(value)) return value.filter(Boolean);
            if (typeof value === "string") {
                return value
                    .split(",")
                    .map(item => item.trim())
                    .filter(Boolean);
            }
            return [];
        }

        function formatValues(values) {
            return normalizeValues(values).join(", ");
        }

        // ================= LOAD CATALOG =================
        async function loadCatalog() {
            await renderMultiSelectDropdown("bases", "baseSelectContainer");
            await renderMultiSelectDropdown("proteins", "proteinSelectContainer");
            await renderMultiSelectDropdown("carbs", "carbSelectContainer");
            await renderMultiSelectDropdown("freeMeals", "freeSelectContainer");
            await renderMultiSelectDropdown("fruits", "fruitSelectContainer");
            await renderMultiSelectDropdown("salads", "saladSelectContainer");

            await renderCatalogModal();
        }

        // ================= DELETE CATALOG =================
        function deleteCatalogItem(store, id) {
            const tx = db.transaction(store, "readwrite");
            tx.objectStore(store).delete(id);
            tx.oncomplete = () => {
                resetCatalogEditor();
                refreshCatalogAndMealSelectors();
            };
        }

        function getCatalogItems(storeName) {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, "readonly");
                const store = tx.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async function renderCatalogModal() {
            const list = document.getElementById("catalogList");
            const pagination = document.getElementById("catalogPagination");

            if (!list || !pagination) return;

            list.innerHTML = "";
            pagination.innerHTML = "";

            const items = await getCatalogItems(activeCatalogStore);

            if (!items.length) {
                list.innerHTML = '<div class="empty-state">Nenhum item cadastrado ainda.</div>';
                return;
            }

            const start = (activeCatalogPage - 1) * CATALOG_ITEMS_PER_PAGE;
            const pageItems = items.slice(start, start + CATALOG_ITEMS_PER_PAGE);

            pageItems.forEach(item => {
                const div = document.createElement("div");
                div.className = "catalog-item";

                const encodedName = encodeURIComponent(item.name || "");

                div.innerHTML = `
                    <span>${escapeHtml(item.name)}</span>
                    <div class="catalog-item-actions">
                        <button class="catalog-action-btn"
                            onclick="editCatalogItem('${activeCatalogStore}', ${item.id}, '${encodedName}')"
                            aria-label="Editar item">
                            ✏️
                        </button>
                        <button class="catalog-action-btn catalog-action-btn--delete"
                            onclick="deleteCatalogItem('${activeCatalogStore}', ${item.id})"
                            aria-label="Excluir item">
                            🗑️
                        </button>
                    </div>
                `;

                list.appendChild(div);
            });

            renderCatalogPagination(items.length);

            // Atualizar event listeners
            const addButton = document.getElementById("catalogItemAddButton");
            const addInput = document.getElementById("catalogItemInput");
            const cancelButton = document.getElementById("catalogItemCancelButton");

            if (addButton && addInput) {
                addButton.onclick = () => {
                    addItemToStore(activeCatalogStore, addInput.value);
                };

                addInput.onkeypress = (e) => {
                    if (e.key === "Enter") {
                        addItemToStore(activeCatalogStore, addInput.value);
                    }
                };
            }

            if (cancelButton) {
                cancelButton.onclick = cancelCatalogEdit;
            }
        }

        function renderCatalogPagination(totalItems) {

            const totalPages = Math.ceil(totalItems / CATALOG_ITEMS_PER_PAGE);
            const pagination = document.getElementById("catalogPagination");

            if (!pagination) return;

            if (totalPages <= 1) {
                pagination.innerHTML = "";
                return;
            }

            pagination.innerHTML = "";

            pagination.style.display = "flex";
            pagination.style.justifyContent = "space-between";
            pagination.style.alignItems = "center";
            pagination.style.gap = "12px";
            pagination.style.marginTop = "20px";
            pagination.style.width = "100%";

            const prevBtn = document.createElement("button");
            prevBtn.type = "button";
            prevBtn.textContent = "◀";
            prevBtn.disabled = activeCatalogPage === 1;
            prevBtn.style.width = "42px";
            prevBtn.style.minWidth = "42px";
            prevBtn.style.height = "42px";
            prevBtn.style.padding = "0";
            prevBtn.style.borderRadius = "10px";
            prevBtn.style.display = "flex";
            prevBtn.style.alignItems = "center";
            prevBtn.style.justifyContent = "center";

            prevBtn.onclick = () => {
                if (activeCatalogPage > 1) {
                    activeCatalogPage--;
                    renderCatalogModal();
                }
            };

            const pageInfo = document.createElement("strong");
            pageInfo.textContent = `Página ${activeCatalogPage} de ${totalPages}`;
            pageInfo.style.flex = "1";
            pageInfo.style.textAlign = "center";
            pageInfo.style.fontSize = "15px";

            const nextBtn = document.createElement("button");
            nextBtn.type = "button";
            nextBtn.textContent = "▶";
            nextBtn.disabled = activeCatalogPage === totalPages;
            nextBtn.style.width = "42px";
            nextBtn.style.minWidth = "42px";
            nextBtn.style.height = "42px";
            nextBtn.style.padding = "0";
            nextBtn.style.borderRadius = "10px";
            nextBtn.style.display = "flex";
            nextBtn.style.alignItems = "center";
            nextBtn.style.justifyContent = "center";

            nextBtn.onclick = () => {
                if (activeCatalogPage < totalPages) {
                    activeCatalogPage++;
                    renderCatalogModal();
                }
            };

            pagination.appendChild(prevBtn);
            pagination.appendChild(pageInfo);
            pagination.appendChild(nextBtn);
        }

        // ================= SAVE MEAL =================
        document.getElementById("mealForm").addEventListener("submit", e => {
            e.preventDefault();

            const dateInput = document.getElementById("date");
            const mealTypeSelect = document.getElementById("mealType");
            const beverageSelect = document.getElementById("beverage");
            const classificationSelect = document.getElementById("classification");
            const notesInput = document.getElementById("notes");

            const meal = {
                date: dateInput.value,
                type: mealTypeSelect.value,
                base: getSelectedValues("baseSelectContainer"),
                protein: getSelectedValues("proteinSelectContainer"),
                carb: getSelectedValues("carbSelectContainer"),
                fruit: getSelectedValues("fruitSelectContainer"),
                salads: getSelectedValues("saladSelectContainer"),
                beverage: beverageSelect.value || null,
                freeMeal: getSelectedValues("freeSelectContainer"),
                classification: classificationSelect.value,
                notes: notesInput.value
            };

            const tx = db.transaction("meals", "readwrite");
            const store = tx.objectStore("meals");

            if (editingMealId !== null) {
                meal.id = editingMealId;
                store.put(meal);
            } else {
                store.add(meal);
            }

            tx.oncomplete = () => {
                loadMeals();
                resetMealForm();
            };

            tx.onerror = () => {
                alert("Não foi possível salvar a refeição.");
            };
        });

        // ================= LOAD MEALS =================
        function loadMeals() {
            const tx = db.transaction("meals", "readonly");
            const store = tx.objectStore("meals");

            const meals = [];

            store.openCursor().onsuccess = e => {
                const cursor = e.target.result;

                if (cursor) {
                    meals.push(cursor.value);
                    cursor.continue();
                } else {
                    allMeals = meals;
                    loadAvailableMonths();
                    refreshDashboard();
                }
            };
        }

        // ================= DELETE MEAL =================
        function deleteMeal(id) {
            const tx = db.transaction("meals", "readwrite");
            tx.objectStore("meals").delete(id);
            tx.oncomplete = loadMeals;
        }

        function editMeal(id) {
            const meal = allMeals.find(item => item.id === id);
            if (!meal) return;

            editingMealId = id;
            document.getElementById("date").value = meal.date || "";
            document.getElementById("mealType").value = meal.type || "cafeManha";

            // Usar setTimeout para garantir que os dropdowns sejam atualizados corretamente
            setTimeout(() => {
                setSelectedValues("baseSelectContainer", meal.base || []);
                setSelectedValues("proteinSelectContainer", meal.protein || []);
                setSelectedValues("carbSelectContainer", meal.carb || []);
                setSelectedValues("freeSelectContainer", meal.freeMeal || []);
                setSelectedValues("fruitSelectContainer", meal.fruit || []);
                setSelectedValues("saladSelectContainer", meal.salads || []);
            }, 100);

            document.getElementById("beverage").value = meal.beverage || "";
            document.getElementById("classification").value = meal.classification || "muitoBoa";
            document.getElementById("notes").value = meal.notes || "";

            document.getElementById("mealSection").scrollIntoView({ behavior: "smooth" });
            const submitButton = document.getElementById("saveMealButton");
            if (submitButton) {
                submitButton.textContent = "✏️ Atualizar refeição";
            }
        }

        function resetMealForm() {
            editingMealId = null;
            document.getElementById("mealForm").reset();
            setDefaultDate();
            setSelectedValues("baseSelectContainer", []);
            setSelectedValues("proteinSelectContainer", []);
            setSelectedValues("carbSelectContainer", []);
            setSelectedValues("freeSelectContainer", []);
            setSelectedValues("fruitSelectContainer", []);
            setSelectedValues("saladSelectContainer", []);
            const submitButton = document.getElementById("saveMealButton");
            if (submitButton) {
                submitButton.textContent = "💾 Salvar refeição";
            }
        }

        function setMealFilter(filter) {
            activeMealFilter = filter;
            currentPage = 1;
            document.querySelectorAll('.chip-btn').forEach(btn => {
                btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === filter || (filter === 'all' && btn.textContent.trim().toLowerCase() === 'todas'));
            });
            render();
        }

        function setMealClassification(value) {
            activeMealClassification = value;
            currentPage = 1;
            render();
        }

        function handleMealSearch(event) {
            mealSearchTerm = event.target.value.trim().toLowerCase();
            currentPage = 1;
            render();
        }

        function openDateFilterPicker() {
            const input = document.getElementById("dateFilterInput");
            if (!input) return;
            if (typeof input.showPicker === "function") {
                input.showPicker();
            } else {
                input.click();
            }
        }

        function applyDateFilter(value) {
            activeDateFilter = value;
            currentPage = 1;
            updateDateFilterUi();
            render();
        }

        function clearDateFilter() {
            activeDateFilter = "";
            const input = document.getElementById("dateFilterInput");
            if (input) input.value = "";
            currentPage = 1;
            updateDateFilterUi();
            render();
        }

        function updateDateFilterUi() {
            const button = document.getElementById("dateFilterButton");
            const clearButton = document.getElementById("clearDateFilterButton");
            const label = document.getElementById("dateFilterLabel");

            if (button) {
                button.textContent = activeDateFilter ? `📅 ${formatDate(activeDateFilter)}` : "📅 Filtrar por dia";
            }

            if (clearButton) {
                clearButton.style.display = activeDateFilter ? "inline-flex" : "none";
            }

            if (label) {
                label.textContent = activeDateFilter ? `Mostrando refeições de ${formatDate(activeDateFilter)}.` : "";
            }
        }

        function getVisibleMeals() {
            const today = getBrazilDateString();
            const { start: weekStart, end: weekEnd } = getWeekRange(today);
            const periodMeals = filterMealsByMonth(selectedMonth);

            return [...periodMeals]
                .filter(m => {
                    if (activeMealClassification && m.classification !== activeMealClassification) return false;

                    if (mealSearchTerm) {
                        const haystack = `${m.notes || ""} ${formatMealType(m.type)} ${formatValues(m.base)} ${formatValues(m.protein)} ${formatValues(m.carb)} ${formatValues(m.fruit)} ${formatValues(m.salads)} ${formatValues(m.freeMeal)}`.toLowerCase();
                        if (!haystack.includes(mealSearchTerm)) return false;
                    }

                    if (!m.date) return false;

                    if (activeDateFilter) {
                        return m.date === activeDateFilter;
                    }

                    switch (activeMealFilter) {
                        case 'today':
                            return m.date === today;
                        case 'week':
                            return m.date >= weekStart && m.date <= weekEnd;
                        case 'month':
                            return selectedMonth === "all" ? true : m.date.startsWith(selectedMonth);
                        default:
                            return true;
                    }
                })
                .sort((a, b) => b.date.localeCompare(a.date));
        }

        function updateMealFeedSummary(meals) {
            const visibleCount = document.getElementById("visibleMealsCount");
            const todayCount = document.getElementById("todayFeedCount");
            const latestLabel = document.getElementById("latestMealLabel");

            if (visibleCount) visibleCount.textContent = meals.length;
            if (todayCount) {
                const today = getBrazilDateString();
                const todayMeals = meals.filter(m => m.date === today).length;
                todayCount.textContent = todayMeals;
            }
            if (latestLabel) {
                const latest = meals[0];
                latestLabel.textContent = latest ? formatDate(latest.date) : "—";
            }
        }

        // ================= FORMATAÇÃO =================

        function formatDate(date) {
            if (!date) return "";

            const [year, month, day] = date.split("-");
            return `${day}/${month}/${year}`;
        }

        function formatMealType(type) {

            const meals = {
                cafeManha: "☕ Café da Manhã",
                almoco: "🍽️ Almoço",
                cafeTarde: "🥪 Café da Tarde",
                jantar: "🌙 Jantar",
                lanche: "🍎 Lanche / Extra"
            };

            return meals[type] || type;
        }

        function formatClassification(value) {

            const map = {
                muitoBoa: "🔥 Muito Bom",
                muitoBoaFlexivel: "✨ Muito Bom Flexível",
                boa: "✅ Bom",
                intermediaria: "⚖️ Intermediária",
                podeMelhorar: "🟠 Pode Melhorar",
                livre: "🍔 Livre"
            };

            return map[value] || value;
        }

        function getClassificationLabel(value) {
            const map = {
                muitoBoa: "Muito Bom",
                muitoBoaFlexivel: "Muito Bom Flexível",
                boa: "Bom",
                intermediaria: "Intermediária",
                podeMelhorar: "Pode melhorar",
                livre: "Livre"
            };

            return map[value] || "Sem avaliação";
        }

        function formatMealTypeForCopy(type) {
            const map = {
                cafeManha: "Café da manhã",
                almoco: "Almoço",
                cafeTarde: "Café da tarde",
                jantar: "Jantar",
                lanche: "Lanche / Extra"
            };

            return map[type] || type;
        }

        function buildMealDetailedDescription(meal) {
            const parts = [];

            // Tipo
            const mealType = formatMealTypeForCopy(meal.type);
            parts.push(`Tipo: ${mealType}`);

            // Base
            const bases = normalizeValues(meal.base);
            if (bases.length > 0) {
                parts.push(`Base: ${bases.join(" • ")}`);
            }

            // Proteínas
            const proteins = normalizeValues(meal.protein);
            if (proteins.length > 0) {
                parts.push(`Proteínas: ${proteins.join(" • ")}`);
            }

            // Carboidratos
            const carbs = normalizeValues(meal.carb);
            if (carbs.length > 0) {
                parts.push(`Carboidratos: ${carbs.join(" • ")}`);
            }

            // Frutas
            const fruits = normalizeValues(meal.fruit);
            if (fruits.length > 0) {
                parts.push(`Frutas: ${fruits.join(" • ")}`);
            }

            // Refeições livres
            const freeMeals = normalizeValues(meal.freeMeal);
            if (freeMeals.length > 0) {
                parts.push(`Refeições Livres: ${freeMeals.join(" • ")}`);
            }

            // Saladas e legumes
            const salads = normalizeValues(meal.salads);
            if (salads.length > 0) {
                parts.push(`Saladas e Legumes: ${salads.join(" • ")}`);
            }

            // Bebida
            if (meal.beverage) {
                const beverageName = getBeverageName(meal.beverage);
                parts.push(`Bebida: ${beverageName}`);
            }

            // Classificação
            const classification = getClassificationLabel(meal.classification);
            parts.push(`Classificação: ${classification}`);

            // Observações (em seção separada)
            if (meal.notes) {
                parts.push(`Obs: ${meal.notes}`);
            }

            return parts.join(" | ");
        }

        function getBeverageName(value) {
            const map = {
                agua: "Água",
                cafe: "Café",
                cha: "Chá",
                suco: "Suco",
                refrigeranteZero: "Refrigerante Zero",
                refrigerante: "Refrigerante",
                energetico: "Energético",
                outro: "Outro"
            };
            return map[value] || value;
        }

        function buildMealCopyDescription(meal) {
            const parts = [];

            parts.push(...normalizeValues(meal.base));
            parts.push(...normalizeValues(meal.protein));
            parts.push(...normalizeValues(meal.carb));
            parts.push(...normalizeValues(meal.fruit));
            parts.push(...normalizeValues(meal.salads));
            parts.push(...normalizeValues(meal.freeMeal));
            if (meal.beverage) parts.push(formatBeverage(meal.beverage));
            if (meal.notes) parts.push(meal.notes);

            if (!parts.length) return "Sem descrição";

            return parts.join(" + ");
        }

        function formatBeverage(value) {

            const map = {
                agua: "💧 Água",
                cafe: "☕ Café",
                cha: "🍵 Chá",
                suco: "🧃 Suco",
                refrigeranteZero: "🥤 Refrigerante Zero",
                refrigerante: "🥤 Refrigerante",
                energetico: "⚡ Energético",
                outro: "🥛 Outro"
            };

            return map[value] || value;
        }


        function copyVisibleMeals() {
            const meals = getVisibleMeals();

            if (!meals.length) {
                alert("Nenhuma refeição para copiar.");
                return;
            }

            const groupedByDate = meals.reduce((acc, meal) => {
                if (!acc[meal.date]) acc[meal.date] = [];
                acc[meal.date].push(meal);
                return acc;
            }, {});

            const sections = Object.entries(groupedByDate)
                .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                .map(([date, dayMeals]) => {
                    const dateHeader = `Data: ${formatDate(date)}`;
                    const lines = dayMeals
                        .map(meal => buildMealDetailedDescription(meal))
                        .join("\n\n");

                    return `${dateHeader}\n\n${lines}`;
                });

            const text = sections.join("\n\n---\n\n");

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    alert("Refeições copiadas com sucesso!");
                }).catch(() => {
                    fallbackCopy(text);
                });
            } else {
                fallbackCopy(text);
            }
        }

        function fallbackCopy(text) {
            const area = document.createElement("textarea");
            area.value = text;
            document.body.appendChild(area);
            area.select();
            document.execCommand("copy");
            document.body.removeChild(area);
            alert("Refeições copiadas com sucesso!");
        }

        // ================= RENDER MEALS =================
        function render() {

            const list = document.getElementById("list");

            updateDateFilterUi();
            list.innerHTML = "";

            const meals = getVisibleMeals();
            updateMealFeedSummary(meals);

            const start = (currentPage - 1) * ITEMS_PER_PAGE;

            const end = start + ITEMS_PER_PAGE;

            const pageMeals = meals.slice(start, end);

            if (!pageMeals.length) {
                list.innerHTML = `<div class="empty-state">${selectedMonth === "all" ? "Nenhuma refeição encontrada para este filtro." : "Nenhuma refeição encontrada para este período."}</div>`;
                renderPagination(meals.length);
                return;
            }

            pageMeals.forEach(m => {

                const div = document.createElement("div");
                div.className = "card";

                div.innerHTML = `

                    <h3>${formatMealType(m.type)}</h3>

                    <p>📅 ${formatDate(m.date)}</p>

                    <hr>

                    ${formatValues(m.base) ? `<p><strong>🍚 Base:</strong> ${formatValues(m.base)}</p>` : ""}

                    ${formatValues(m.protein) ? `<p><strong>🥩 Proteína:</strong> ${formatValues(m.protein)}</p>` : ""}

                    ${formatValues(m.carb) ? `<p><strong>🍝 Carboidrato:</strong> ${formatValues(m.carb)}</p>` : ""}

                    ${formatValues(m.fruit) ? `<p><strong>🍌 Fruta:</strong> ${formatValues(m.fruit)}</p>` : ""}

                    ${formatValues(m.salads) ? `<p><strong>🥗 Saladas e Legumes:</strong> ${formatValues(m.salads)}</p>` : ""}

                    ${m.beverage ? `<p><strong>🥤 Bebida:</strong> ${formatBeverage(m.beverage)}</p>` : ""}

                    ${formatValues(m.freeMeal) ? `<p><strong>🍔 Refeição Livre:</strong> ${formatValues(m.freeMeal)}</p>` : ""}

                    <p><strong>⭐ Classificação:</strong> ${formatClassification(m.classification)}</p>

                    ${m.notes ? `<p><strong>📝 Observações:</strong><br>${m.notes}</p>` : ""}

                    <div class="grid" style="margin-top:10px; gap:8px;">
                        <button class="catalog-action-btn"
                            onclick="editMeal(${m.id})">
                            ✏️ Editar
                        </button>
                        <button class="delete-btn"
                            onclick="deleteMeal(${m.id})">
                            🗑️ Excluir
                        </button>
                    </div>

                `;

                list.appendChild(div);
            });

            renderPagination(meals.length);

        }

        // ================= DASHBOARD =================
        function dashboard(meals) {

            const counts = {
                muitoBoa: 0,
                muitoBoaFlexivel: 0,
                boa: 0,
                intermediaria: 0,
                podeMelhorar: 0,
                livre: 0
            };

            let total = 0;
            let count = 0;

            const today = getBrazilDateString();

            let todayTotal = 0;
            let todayCount = 0;

            meals.forEach(m => {
                counts[m.classification]++;
                total += scoreMap[m.classification] || 0;
                count++;

                if (m.date === today && (selectedMonth === "all" || selectedMonth === getCurrentMonth())) {
                    todayTotal += scoreMap[m.classification] || 0;
                    todayCount++;
                }
            });

            for (let k in counts) {
                document.getElementById(k).innerText = counts[k];
            }

            const avg = count ? (total / count) : 0;
            document.getElementById("score8020").innerText =
                Math.round(avg * 100) + "%";

            let todayAvg = todayCount ? (todayTotal / todayCount) : 0;

            let status = "-";
            if (todayCount) {
                if (todayAvg >= 0.75) status = "Saudável 🔥";
                else if (todayAvg >= 0.5) status = "Intermediário ⚖️";
                else status = "Ruim 🍔";
            }

            document.getElementById("todayStatus").innerText = status;
        }


        // ================= EXPORTAR BANCO =================

        async function exportDatabase() {

            const stores = ["bases", "proteins", "carbs", "freeMeals", "fruits", "salads", "meals"];

            const backup = {
                version: 1,
                exportDate: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
            };

            for (const storeName of stores) {
                backup[storeName] = await getAll(storeName);
            }

            const json = JSON.stringify(backup, null, 2);

            const blob = new Blob([json], {
                type: "application/json"
            });

            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");

            const today = getBrazilDateString();

            a.href = url;
            a.download = `alimentacao_backup_${today}.json`;

            a.click();

            URL.revokeObjectURL(url);

        }

        // ================= LER STORE =================

        function getAll(storeName) {

            return new Promise((resolve, reject) => {

                const tx = db.transaction(storeName, "readonly");

                const request = tx.objectStore(storeName).getAll();

                request.onsuccess = () => resolve(request.result);

                request.onerror = () => reject(request.error);

            });

        }

        // ================= IMPORTAR =================

        async function importDatabase(event) {

            const file = event.target.files[0];

            if (!file) return;

            if (!confirm("Todos os dados atuais serão substituídos.\n\nDeseja continuar?"))
                return;

            const text = await file.text();

            const backup = JSON.parse(text);

            await clearDatabase();

            await restoreStore("bases", backup.bases || []);
            await restoreStore("proteins", backup.proteins || []);
            await restoreStore("carbs", backup.carbs || []);
            await restoreStore("freeMeals", backup.freeMeals || []);
            await restoreStore("fruits", backup.fruits || []);
            await restoreStore("salads", backup.salads || []);
            await restoreStore("meals", backup.meals || []);

            alert("Backup restaurado com sucesso!");

            loadCatalog();
            loadMeals();

        }

        // ================= LIMPAR BANCO =================

        function clearStore(storeName) {

            return new Promise((resolve) => {

                const tx = db.transaction(storeName, "readwrite");

                tx.objectStore(storeName).clear();

                tx.oncomplete = () => resolve();

            });

        }

        async function clearDatabase() {

            await clearStore("bases");
            await clearStore("proteins");
            await clearStore("carbs");
            await clearStore("freeMeals");
            await clearStore("fruits");
            await clearStore("salads");
            await clearStore("meals");

        }

        // ================= RESTAURAR =================

        function restoreStore(storeName, data) {

            return new Promise((resolve) => {

                const tx = db.transaction(storeName, "readwrite");

                const store = tx.objectStore(storeName);

                data.forEach(item => store.put(item));

                tx.oncomplete = () => resolve();

            });

        }

        // ================= RESETAR BANCO =================

        async function resetDatabase() {

            const confirmacao1 = confirm(
                "⚠️ ATENÇÃO!\n\nTodos os dados cadastrados serão apagados.\n\nDeseja continuar?"
            );

            if (!confirmacao1) return;

            const confirmacao2 = confirm(
                "Esta ação NÃO pode ser desfeita.\n\nTem certeza absoluta?"
            );

            if (!confirmacao2) return;

            await clearDatabase();

            loadCatalog();
            loadMeals();

            alert("✅ Banco de dados limpo com sucesso!");

        }

        function renderPagination(totalItems) {

            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

            if (totalPages <= 1) return;

            const div = document.createElement("div");

            div.style.display = "flex";
            div.style.justifyContent = "space-between";
            div.style.alignItems = "center";
            div.style.gap = "12px";
            div.style.marginTop = "20px";

            div.innerHTML = `

        <button
            style="
                width:42px;
                min-width:42px;
                height:42px;
                padding:0;
                border-radius:10px;
                display:flex;
                align-items:center;
                justify-content:center;
            "
            ${currentPage == 1 ? "disabled" : ""}
            onclick="changePage(-1)">
            ◀
        </button>

        <strong style="
            flex:1;
            text-align:center;
            font-size:15px;
        ">
            Página ${currentPage} de ${totalPages}
        </strong>

        <button
            style="
                width:42px;
                min-width:42px;
                height:42px;
                padding:0;
                border-radius:10px;
                display:flex;
                align-items:center;
                justify-content:center;
            "
            ${currentPage == totalPages ? "disabled" : ""}
            onclick="changePage(1)">
            ▶
        </button>

    `;

            document.getElementById("list").appendChild(div);

        }


        function changePage(step) {

            currentPage += step;

            render();

        }
