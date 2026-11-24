document.addEventListener("DOMContentLoaded", () => {
    // ----------------------------------------------------
    // State & Variables
    // ----------------------------------------------------
    let currentSlide = 1;
    const totalSlides = 23; // Slide 24 removed
    const slides = document.querySelectorAll(".slide");
    const progressBar = document.getElementById("progress-bar");
    const currentSlideNum = document.getElementById("current-slide-num");
    const totalSlideNum = document.getElementById("total-slide-num");
    const sidebar = document.getElementById("sidebar");
    const notesSidebar = document.getElementById("notes-sidebar");
    const notesTextarea = document.getElementById("notes-textarea");
    const lightbox = document.getElementById("lightbox");
    const lightboxWrapper = document.getElementById("lightbox-content-wrapper");

    // Initialize slide count display
    totalSlideNum.textContent = totalSlides;

    // ----------------------------------------------------
    // Slide Navigation Logic
    // ----------------------------------------------------
    function showSlide(index) {
        // Bounds checking
        if (index < 1) index = 1;
        if (index > totalSlides) index = totalSlides;

        // Pause any playing videos on the previous slide
        const currentActiveSlide = document.querySelector(".slide.current");
        if (currentActiveSlide) {
            const videos = currentActiveSlide.querySelectorAll("video");
            videos.forEach(video => video.pause());
        }

        // Remove active class from all slides
        slides.forEach(slide => slide.classList.remove("current"));

        // Activate target slide
        const targetSlide = document.getElementById(`slide-${index}`);
        if (targetSlide) {
            targetSlide.classList.add("current");
            // Auto scroll slide content to top
            const content = targetSlide.querySelector(".slide-content");
            if (content) content.scrollTop = 0;
        }

        currentSlide = index;

        // Update progress bar & counter
        const progressPercentage = (currentSlide / totalSlides) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        currentSlideNum.textContent = currentSlide;

        // Sync sidebar active state
        document.querySelectorAll(".index-list li[data-slide]").forEach(item => {
            if (parseInt(item.getAttribute("data-slide")) === currentSlide) {
                item.classList.add("active");
                // Scroll sidebar to active element
                item.scrollIntoView({ block: "nearest", behavior: "smooth" });
            } else {
                item.classList.remove("active");
            }
        });

        // Toggle visibility of navigation arrows at start/end
        document.getElementById("prev-slide-btn").style.visibility = currentSlide === 1 ? "hidden" : "visible";
        document.getElementById("next-slide-btn").style.visibility = currentSlide === totalSlides ? "hidden" : "visible";
    }

    function nextSlide() {
        if (currentSlide < totalSlides) {
            showSlide(currentSlide + 1);
        }
    }

    function prevSlide() {
        if (currentSlide > 1) {
            showSlide(currentSlide - 1);
        }
    }

    // Click listeners for nav arrows
    document.getElementById("next-slide-btn").addEventListener("click", nextSlide);
    document.getElementById("prev-slide-btn").addEventListener("click", prevSlide);

    // Keyboard Navigation
    document.addEventListener("keydown", (e) => {
        // Prevent key events if the user is typing in notes or answer fields
        if (document.activeElement.tagName === "TEXTAREA" || document.activeElement.tagName === "INPUT") {
            return;
        }

        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
            e.preventDefault();
            nextSlide();
        } else if (e.key === "ArrowLeft" || e.key === "Backspace" || e.key === "PageUp") {
            e.preventDefault();
            prevSlide();
        } else if (e.key === "Home") {
            e.preventDefault();
            showSlide(1);
        } else if (e.key === "End") {
            e.preventDefault();
            showSlide(totalSlides);
        }
    });

    // Touch Swipe Navigation for mobile/tablets
    let touchStartX = 0;
    let touchEndX = 0;
    document.addEventListener("touchstart", (e) => {
        if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || e.target.closest("video")) {
            return;
        }
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    document.addEventListener("touchend", (e) => {
        if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || e.target.closest("video")) {
            return;
        }
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);

    function handleSwipe() {
        const threshold = 50;
        if (touchStartX - touchEndX > threshold) {
            nextSlide(); // Swipe left -> Next
        }
        if (touchEndX - touchStartX > threshold) {
            prevSlide(); // Swipe right -> Prev
        }
    }

    // ----------------------------------------------------
    // Index Sidebar Drawer
    // ----------------------------------------------------
    const menuBtn = document.getElementById("menu-btn");
    const closeSidebarBtn = document.getElementById("close-sidebar-btn");

    function openSidebar() {
        sidebar.classList.add("active");
        notesSidebar.classList.remove("active"); // close other
    }

    function closeSidebar() {
        sidebar.classList.remove("active");
    }

    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (sidebar.classList.contains("active")) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    closeSidebarBtn.addEventListener("click", closeSidebar);

    // Click on index list item to jump to slide
    document.querySelectorAll(".index-list li[data-slide]").forEach(item => {
        item.addEventListener("click", () => {
            const slideIndex = parseInt(item.getAttribute("data-slide"));
            showSlide(slideIndex);
            closeSidebar();
        });
    });

    // Interactive Index Items on Slide 2
    document.querySelectorAll(".index-item[data-target]").forEach(item => {
        item.addEventListener("click", (e) => {
            e.stopPropagation();
            const target = parseInt(item.getAttribute("data-target"));
            showSlide(target);
        });
    });

    // ----------------------------------------------------
    // Notes Sidebar Drawer & Autosave
    // ----------------------------------------------------
    const notesBtn = document.getElementById("notes-btn");
    const closeNotesBtn = document.getElementById("close-notes-btn");
    const downloadNotesBtn = document.getElementById("download-notes-btn");

    function openNotes() {
        notesSidebar.classList.add("active");
        sidebar.classList.remove("active"); // close other
    }

    function closeNotes() {
        notesSidebar.classList.remove("active");
    }

    notesBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (notesSidebar.classList.contains("active")) {
            closeNotes();
        } else {
            openNotes();
        }
    });

    closeNotesBtn.addEventListener("click", closeNotes);

    // Autosave notes to LocalStorage
    if (localStorage.getItem("presentation_notes")) {
        notesTextarea.value = localStorage.getItem("presentation_notes");
    }

    notesTextarea.addEventListener("input", () => {
        localStorage.setItem("presentation_notes", notesTextarea.value);
    });

    // Download notes as .txt file
    downloadNotesBtn.addEventListener("click", () => {
        const text = notesTextarea.value;
        if (!text.trim()) {
            alert("¡Tu panel de notas está vacío! Escribe algo antes de descargar.");
            return;
        }
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const element = document.createElement("a");
        element.href = URL.createObjectURL(blob);
        element.download = "notas_realismo_naturalismo_4eso.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    });

    // Click outside drawers to close them
    document.addEventListener("click", (e) => {
        if (sidebar.classList.contains("active") && !sidebar.contains(e.target) && e.target !== menuBtn) {
            closeSidebar();
        }
        if (notesSidebar.classList.contains("active") && !notesSidebar.contains(e.target) && e.target !== notesBtn) {
            closeNotes();
        }
    });

    // ----------------------------------------------------
    // Fullscreen Mode
    // ----------------------------------------------------
    const fullscreenBtn = document.getElementById("fullscreen-btn");

    fullscreenBtn.addEventListener("click", () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                fullscreenBtn.innerHTML = `<i class="fa-solid fa-compress"></i> <span>Salir</span>`;
            }).catch(err => {
                console.error(`Error al intentar activar pantalla completa: ${err.message}`);
            });
        } else {
            document.exitFullscreen().then(() => {
                fullscreenBtn.innerHTML = `<i class="fa-solid fa-expand"></i> <span>Pantalla Completa</span>`;
            });
        }
    });

    // Sync fullscreen button icon if state changes externally (e.g. Esc key)
    document.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement) {
            fullscreenBtn.innerHTML = `<i class="fa-solid fa-expand"></i> <span>Pantalla Completa</span>`;
        } else {
            fullscreenBtn.innerHTML = `<i class="fa-solid fa-compress"></i> <span>Salir</span>`;
        }
    });

    // ----------------------------------------------------
    // Fullscreen Lightbox Modal (For Images and Videos)
    // ----------------------------------------------------
    const closeLightboxBtn = document.getElementById("close-lightbox-btn");

    function openLightbox(element) {
        // Clear previous content
        lightboxWrapper.innerHTML = "";
        
        let clone;
        if (element.tagName === "IMG") {
            clone = document.createElement("img");
            clone.src = element.src;
            clone.alt = element.alt;
        } else if (element.tagName === "VIDEO") {
            clone = document.createElement("video");
            clone.src = element.querySelector("source").src;
            clone.controls = true;
            clone.autoplay = true;
            // Copy current playback time if video is playing in slide
            clone.currentTime = element.currentTime;
            // Pause slide video while playing in lightbox
            element.pause();
        }

        if (clone) {
            lightboxWrapper.appendChild(clone);
            lightbox.classList.add("active");
        }
    }

    function closeLightbox() {
        const video = lightboxWrapper.querySelector("video");
        if (video) {
            video.pause();
            // Try to sync play time back to slide video if exists
            const activeSlideVideo = document.querySelector(".slide.current video");
            if (activeSlideVideo) {
                activeSlideVideo.currentTime = video.currentTime;
            }
        }
        lightboxWrapper.innerHTML = "";
        lightbox.classList.remove("active");
    }

    // Attach click events to zoomable images
    document.querySelectorAll(".zoomable").forEach(img => {
        img.addEventListener("click", () => openLightbox(img));
    });

    // Attach click/expand events to videos (if they click on video container or we can let them open)
    document.querySelectorAll(".html5-video").forEach(vid => {
        vid.addEventListener("dblclick", () => openLightbox(vid));
    });

    closeLightboxBtn.addEventListener("click", closeLightbox);
    
    // Close lightbox when clicking the backdrop
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox || e.target === lightboxWrapper) {
            closeLightbox();
        }
    });

    // Esc key closes lightbox
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && lightbox.classList.contains("active")) {
            closeLightbox();
        }
    });

    // ----------------------------------------------------
    // Slides 6 & 7: Reveal text on image click
    // ----------------------------------------------------
    document.querySelectorAll(".art-img-interactive").forEach(img => {
        img.addEventListener("click", (e) => {
            e.stopPropagation();
            const grid = img.closest(".art-grid");
            if (grid) {
                grid.classList.toggle("show-info");
            }
        });

        // Double click on these images zooms them into lightbox
        img.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            openLightbox(img);
        });
    });

    // ----------------------------------------------------
    // Timeline Widget (Diapositiva 3)
    // ----------------------------------------------------
    const timelineTabs = document.querySelectorAll(".timeline-tab");
    const timelinePanels = document.querySelectorAll(".timeline-panel");

    timelineTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const period = tab.getAttribute("data-period");
            
            // Toggle active tab
            timelineTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            // Toggle active panel
            timelinePanels.forEach(panel => {
                if (panel.id === `period-${period}`) {
                    panel.classList.add("active");
                } else {
                    panel.classList.remove("active");
                }
            });
        });
    });

    // ----------------------------------------------------
    // Tabs Switchers for Slide 5, 14, 16
    // ----------------------------------------------------
    function setupTabs(btnTable, btnGame, btnImg, panelT, panelG, panelI) {
        const btns = [btnTable, btnGame, btnImg].filter(Boolean);
        const panels = [panelT, panelG, panelI].filter(Boolean);

        btns.forEach((btn, idx) => {
            btn.addEventListener("click", () => {
                btns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                panels.forEach((p, pIdx) => {
                    if (idx === pIdx) {
                        p.classList.add("active");
                    } else {
                        p.classList.remove("active");
                    }
                });
            });
        });
    }

    // Setup for Slide 5 (Evolución)
    setupTabs(
        document.getElementById("btn-show-table"),
        document.getElementById("btn-show-game"),
        document.getElementById("btn-show-img"),
        document.getElementById("panel-table"),
        document.getElementById("panel-game"),
        document.getElementById("panel-img")
    );

    // Setup for Slide 14 (Galdós)
    setupTabs(
        document.getElementById("btn-galdos-columns"),
        document.getElementById("btn-galdos-map"),
        document.getElementById("btn-galdos-img"),
        document.getElementById("panel-galdos-columns"),
        document.getElementById("panel-galdos-map"),
        document.getElementById("panel-galdos-img")
    );

    // Setup for Slide 16 (Naturalismo)
    setupTabs(
        document.getElementById("btn-nat-table"),
        null,
        document.getElementById("btn-nat-img"),
        document.getElementById("panel-nat-table"),
        null,
        document.getElementById("panel-nat-img")
    );

    // ----------------------------------------------------
    // Micro-Game: Romanticismo vs Realismo (Slide 5)
    // ----------------------------------------------------
    const gameStatements = [
        {
            text: '"El arte se basa en la inspiración individual, la subjetividad y el delirio de la fantasía."',
            answer: 'romanticismo'
        },
        {
            text: '"Se centra en retratar la realidad social contemporánea y cotidiana, imitando el método científico."',
            answer: 'realismo'
        },
        {
            text: '"Los personajes principales son héroes idealizados, rebeldes e incomprendidos que luchan contra el destino."',
            answer: 'romanticismo'
        },
        {
            text: '"Los personajes son vulgares y anónimos, condicionados por su clase social y su ambiente."',
            answer: 'realismo'
        },
        {
            text: '"Los dialogues reproducen con fidelidad el habla coloquial y dialectal de las gentes."',
            answer: 'realismo'
        },
        {
            text: '"El autor huye del presente refugiándose en la Edad Media o en mundos exóticos lejanos."',
            answer: 'romanticismo'
        }
    ];

    let currentGameIdx = 0;
    const gameCard = document.getElementById("game-card-content");
    const gameFeedback = document.getElementById("game-feedback");
    const nextGameBtn = document.getElementById("next-game-btn");
    const gameOptBtns = document.querySelectorAll(".game-opt-btn");

    function loadGameStatement(idx) {
        if (idx >= gameStatements.length) {
            currentGameIdx = 0; // Loop game
            idx = 0;
        }
        gameCard.textContent = gameStatements[idx].text;
        gameFeedback.textContent = "";
        gameFeedback.className = "game-feedback";
        nextGameBtn.classList.add("hide");
        gameOptBtns.forEach(btn => btn.disabled = false);
    }

    gameOptBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const choice = btn.getAttribute("data-correct");
            const answer = gameStatements[currentGameIdx].answer;

            gameOptBtns.forEach(b => b.disabled = true); // Disable options

            if (choice === answer) {
                gameFeedback.textContent = "✓ ¡Correcto! Excelente análisis.";
                gameFeedback.className = "game-feedback correct";
            } else {
                gameFeedback.textContent = `✗ Incorrecto. Corresponde a: ${answer === 'romanticismo' ? 'Romanticismo' : 'Realismo-Naturalismo'}.`;
                gameFeedback.className = "game-feedback incorrect";
            }
            nextGameBtn.classList.remove("hide");
        });
    });

    nextGameBtn.addEventListener("click", () => {
        currentGameIdx++;
        loadGameStatement(currentGameIdx);
    });

    // Initialize game
    if (gameCard) {
        loadGameStatement(0);
    }

    // ----------------------------------------------------
    // Activities - Toggle Suggested Answers
    // ----------------------------------------------------
    document.querySelectorAll(".show-suggested-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const answerDiv = btn.nextElementSibling;
            if (answerDiv && answerDiv.classList.contains("suggested-answer")) {
                answerDiv.classList.toggle("hide");
                btn.textContent = answerDiv.classList.contains("hide") ? "Ver Respuesta de Guía" : "Ocultar Respuesta";
            }
        });
    });

    // ----------------------------------------------------
    // Interactive Map Cards (Slide 14)
    // ----------------------------------------------------
    document.querySelectorAll(".map-place-card").forEach(card => {
        card.addEventListener("click", () => {
            const place = card.getAttribute("data-place");
            alert(`Has seleccionado la parada: ${card.querySelector("h5").textContent}.\nSe ha copiado la descripción de esta parada histórica a tu panel de notas.`);
            
            // Append to notes
            const val = notesTextarea.value;
            const textToAdd = `\n[Parada Madrid de Galdós: ${card.querySelector("h5").textContent}]\n${card.querySelector("p").textContent}\n`;
            notesTextarea.value = val + textToAdd;
            localStorage.setItem("presentation_notes", notesTextarea.value);
        });
    });

    // Initialize first slide on load
    showSlide(1);
});
