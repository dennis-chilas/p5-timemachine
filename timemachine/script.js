let img_preview;
let slides;
    let gridImages;
    let gridContent;
    let activeIndex = 0;
    let currentView = localStorage.getItem('tmViewMode') || 'slider';
    let commitCollapseTimer;
    const COMMIT_COLLAPSE_DELAY = 5000;

function smoothScroll(element, target, duration) {
    target = Math.round(target);
    duration = Math.round(duration);
    if (duration < 0) {
        return Promise.reject("bad duration");
    }
    if (duration === 0) {
        element.scrollTop = target;
        return Promise.resolve();
    }

    let start_time = Date.now();
    let end_time = start_time + duration;

    let start_top = element.scrollTop;
    let distance = target - start_top;

    let smooth_step = function (start, end, point) {
        if (point <= start) { return 0; }
        if (point >= end) { return 1; }
        let x = (point - start) / (end - start);
        return x * x * (3 - 2 * x);
    }

    return new Promise(function (resolve, reject) {
        let previous_top = element.scrollTop;

        let scroll_frame = function () {
            if (element.scrollTop != previous_top) {
                resolve();
                return;
            }

            let now = Date.now();
            let point = smooth_step(start_time, end_time, now);
            let frameTop = Math.round(start_top + (distance * point));
            element.scrollTop = frameTop;

            if (now >= end_time) {
                resolve();
                return;
            }

            if (element.scrollTop === previous_top && element.scrollTop !== frameTop) {
                resolve();
                return;
            }
            previous_top = element.scrollTop;

            setTimeout(scroll_frame, 0);
        }
        setTimeout(scroll_frame, 0);
    });
}

function scrollItemIntoView(container, item) {
    if (!container || !item) {
        return;
    }

    item.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
    });
}

function filterList() {
    let input = document.getElementById('searchInput');
    let filter = input.value.toLowerCase();
    let list = document.getElementById("commits");
    let listItems = list.getElementsByTagName('li');
    
    Array.from(listItems).forEach(function(item) {
        if (item.textContent.toLowerCase().indexOf(filter) > -1) {
            item.style.display = "";
        } else {
            item.style.display = "none";
        }
    });
}

function reformatTimestamp(timestamp) {
    // Eingabedatum und -zeit mit Zeitzone
    let date = new Date(timestamp);
  
    // Einzelne Komponenten des Datums und der Zeit extrahieren
    let year = date.getFullYear().toString().slice(2); // Nur die letzten beiden Ziffern des Jahres
    let month = String(date.getMonth() + 1).padStart(2, '0'); // Monate sind 0-indiziert
    let day = String(date.getDate()).padStart(2, '0');
    let hours = String(date.getHours()).padStart(2, '0');
    let minutes = String(date.getMinutes()).padStart(2, '0');
    let seconds = String(date.getSeconds()).padStart(2, '0');
  
    // Zusammenführen der Komponenten im gewünschten Format
    let formattedTimestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`;
  
    return formattedTimestamp;
  }

  function extractHash(inputString) {
    // Muster für den Hash finden
    let hashPattern = /hash:\s(0x[a-fA-F0-9]{64})/;
    
    // Den Hash aus dem String extrahieren
    let match = inputString.match(hashPattern);
    
    // Überprüfen, ob ein Hash gefunden wurde und zurückgeben
    if (match) {
      return match[1];
    } else {
      return null; // Falls kein Hash gefunden wurde
    }
  }



function loaded(){
    img_preview = document.querySelector('#preview');
    console.log(img_preview)
    let list = document.getElementById("commits");
    let listItems = Array.from(list.querySelectorAll("li"));
    let currentItem = 0;
    listItems[currentItem].classList.add("active");
    // Scroll active item into view on initial load
    scrollItemIntoView(list, listItems[currentItem]);
    // img_preview.src = listItems[currentItem].getAttribute('data-img');


    document.getElementById('searchInput').addEventListener('input', function() {
        filterList();
        listItems = Array.from(list.querySelectorAll("li"));
        currentItem = listItems.findIndex(item => item.classList.contains("active"));
        if (currentItem === -1 && listItems.length > 0) {
            currentItem = 0;
            listItems[currentItem].classList.add("active");
        }
        // Scroll active item into view if it exists
        if (currentItem >= 0 && listItems[currentItem]) {
            scrollItemIntoView(list, listItems[currentItem]);
        }
        if (currentView === 'grid') {
            handleCommitListActivity();
        }
        // img_preview.src = listItems[currentItem].getAttribute('data-img');

    });

  

    listItems.forEach(function (item, index) {
        item.addEventListener("click", function (e) {
            listItems[currentItem].classList.remove("active");
            e.target.classList.add("active");
            scrollItemIntoView(list, e.target);
            currentItem = index;
        });
    });

    

    document.addEventListener('keydown', function(event) {
        if (event.keyCode === 40) { // down arrow key
            event.preventDefault();
            // Find next visible item
            let nextIndex = currentItem + 1;
            while (nextIndex < listItems.length && listItems[nextIndex].style.display === 'none') {
                nextIndex++;
            }
            let nextItem = listItems[nextIndex];
            if (nextItem && nextItem.style.display !== 'none') {
                listItems[currentItem].classList.remove("active");
                nextItem.classList.add("active");
                scrollItemIntoView(list, nextItem);
                console.log( nextItem.getAttribute('data-img'))
               
                currentItem = nextIndex;
                setActiveSlide(currentItem);
                if (currentView === 'grid') {
                    handleCommitListActivity();
                }
            }
        } else if (event.keyCode === 38) { // up arrow key
            event.preventDefault();
            // Find previous visible item
            let prevIndex = currentItem - 1;
            while (prevIndex >= 0 && listItems[prevIndex].style.display === 'none') {
                prevIndex--;
            }
            let prevItem = listItems[prevIndex];
            if (prevItem && prevItem.style.display !== 'none') {
                listItems[currentItem].classList.remove("active");
                prevItem.classList.add("active");
                // img_preview.src = prevItem.getAttribute('data-img');
                scrollItemIntoView(list, prevItem);
                currentItem = prevIndex;
                setActiveSlide(currentItem);
                if (currentView === 'grid') {
                    handleCommitListActivity();
                }
            }
        }
        // Check for Cmd+K on Mac
        if (event.metaKey && event.key === 'k') {
            event.preventDefault();
            document.getElementById('searchInput').focus();
        }

        // Check for Ctrl+K on Windows/Linux
        if (event.ctrlKey && event.key === 'k') {
            event.preventDefault();
            document.getElementById('searchInput').focus();
        }
        // Check for Cmd+K on Mac
        if (event.metaKey && event.key === 'ArrowRight') {
            event.preventDefault();
            // document.getElementById('searchInput').focus();
            const activeElement = document.querySelector('li.active');
            if (activeElement) {
                // Log the value of its data-hash attribute
                const dataHash = activeElement.getAttribute('data-hash');
                console.log('Active element data-hash:', dataHash);
                checkoutCommit(dataHash)
            } else {
                console.log('No active element found.');
            }
        }

        // Check for Ctrl+K on Windows/Linux
        if (event.ctrlKey && event.key === 'ArrowRight') {
            event.preventDefault();
            const activeElement = document.querySelector('li.active');
            if (activeElement) {
                // Log the value of its data-hash attribute
                const dataHash = activeElement.getAttribute('data-hash');
                console.log('Active element data-hash:', dataHash);
                checkoutCommit(dataHash)
            } else {
                console.log('No active element found.');
            }
            // document.getElementById('searchInput').focus();
        }
    });
    slides = document.querySelectorAll('#slider .slide');
    gridImages = document.querySelectorAll('.grid-img');
    gridContent = document.getElementById('grid');
    setActiveSlide(activeIndex);

    const viewToggleButtons = document.querySelectorAll('.view-toggle-btn');
    viewToggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetView = button.getAttribute('data-view');
            setView(targetView);
        });
    });
    setView(currentView);

    // Grid size slider
    const gridSizeSlider = document.getElementById('gridSizeSlider');
    if (gridSizeSlider) {
        // Load saved image width from localStorage
        const savedWidth = localStorage.getItem('gridImageWidth');
        if (savedWidth) {
            const width = parseInt(savedWidth);
            gridSizeSlider.value = width;
            updateGridSize(width);
        }
        
        gridSizeSlider.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            updateGridSize(size);
        });
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        // Load saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            // themeToggle.querySelector('.theme-icon').textContent = '☀️';
        } else {
            // themeToggle.querySelector('.theme-icon').textContent = '🌙';
        }

        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            const themeIcon = themeToggle.querySelector('.theme-icon');
            
            if (isDark) {
                // themeIcon.textContent = '☀️';
                localStorage.setItem('theme', 'dark');
            } else {
                // themeIcon.textContent = '🌙';
                localStorage.setItem('theme', 'light');
            }
        });
    }

    document.getElementById('searchInput').focus();
}

function formatDateTime(isoString) {
    // Create a new Date object from the ISO string
    const date = new Date(isoString);

    // Get the individual components of the date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Format the date and time
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    
    return formattedDate;
}



async function fetchCommits() {
    const response = await fetch('/commits');

    const commits = await response.json();
    const commitsList = document.getElementById('commits');
    const gridElement = document.getElementById('grid');
    const sliderElement = document.getElementById('slider');
    commitsList.innerHTML = '';
    gridElement.innerHTML = '';
    sliderElement.innerHTML = '';
    commits.forEach((commit,i) => {
        const tmp_time = reformatTimestamp(commit.date);
        const tmp_hash = extractHash(commit.message);


        commit.image = "/project/download/"+tmp_time + "_" + commit.hash + "_" +tmp_hash+"_s.webp";
        const gridImg = document.createElement('img');
        gridImg.src = commit.image;
        gridImg.classList.add('grid-img');
        gridImg.dataset.index = i;

        const sliderImg = document.createElement('img');
        sliderImg.src = commit.image;
        sliderImg.classList.add('slide');
        sliderImg.dataset.index = i;
        


        const listItem = document.createElement('li');
        listItem.setAttribute('tabindex', i);
        listItem.setAttribute('data-hash', commit.hash);
        listItem.setAttribute('data-img', commit.image);
        if(i == 0){
            listItem.classList.add('active')
            gridImg.classList.add('active')
            sliderImg.classList.add('active')
        }
        gridElement.appendChild(gridImg);
        sliderElement.appendChild(sliderImg);
        
        // Update slider position when image loads
        sliderImg.addEventListener('load', () => {
            if (currentView === 'slider' && i === activeIndex) {
                setActiveSlide(activeIndex);
            }
        });
        
        listItem.innerHTML = `<div class="flex"><div class="commit-text"><div class="status ${(commit.refs.includes('HEAD') && !commit.refs.includes('origin')) ? 'head' : ''}">●</div>${formatDateTime(commit.date)} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${commit.hash}</div> <div><span class="btn">CMD</span> <span class="btn">→</span></div> </div>`;
        // listItem.innerHTML = `${commit.message} / ${commit.refs}`;
        
        // if(commit.refs != "HEAD"){
        //     const checkoutButton = document.createElement('button');
        //     checkoutButton.textContent = 'Checkout';
        //     checkoutButton.onclick = () => checkoutCommit(commit.hash);
        //     listItem.appendChild(checkoutButton);
        // }
        commitsList.appendChild(listItem);
        
        const selectItem = () => {
            activeIndex = i;
            const list = document.getElementById("commits");
            const listItems = Array.from(list.querySelectorAll("li"));
            if (listItems[i]) {
                listItems.forEach(item => item.classList.remove("active"));
                listItems[i].classList.add("active");
                scrollItemIntoView(list, listItems[i]);
                setActiveSlide(i);
                if (currentView === 'grid') {
                    handleCommitListActivity();
                }
            }
        };
        gridImg.addEventListener('click', selectItem);
        sliderImg.addEventListener('click', selectItem);
    });
    console.log(commits);
    gridImages = document.querySelectorAll('.grid-img');
    gridContent = document.getElementById('grid');
    
    // Restore saved image width after images are loaded
    const savedWidth = localStorage.getItem('gridImageWidth');
    if (savedWidth && gridImages.length > 0) {
        const width = parseInt(savedWidth);
        const gridSizeSlider = document.getElementById('gridSizeSlider');
        if (gridSizeSlider) {
            gridSizeSlider.value = width;
        }
        gridImages.forEach(img => {
            img.style.width = `${width}px`;
        });
    }
    
    loaded();
}

async function checkoutCommit(commitHash) {
    const response = await fetch('/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commitHash })
    });
    const result = await response.json();
    if (result.success) {
        alert(`Checked out commit: ${commitHash}`);
        location.reload();
    } else {
        alert('Error checking out commit');
    }
}

fetchCommits();



function setActiveSlide(index) {
    if (!slides || slides.length === 0) {
        return;
    }
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
    const gridImages = document.querySelectorAll('.grid-img');
    if (gridImages && gridImages.length) {
        gridImages.forEach((img, i) => {
            img.classList.toggle('active', i === index);
        });
        centerGridImage(index);
    }

    const sliderTrack = document.getElementById('slider');
    const activeSlide = slides[index];
    if (!sliderTrack || !activeSlide) {
        return;
    }

    const container = sliderTrack.parentElement;
    if (!container) {
        return;
    }

    // Use container width for centering calculation
    const containerWidth = container.clientWidth;
    const slideWidth = activeSlide.offsetWidth;
    const gutter = Math.max((containerWidth - slideWidth) / 2, 0);
    sliderTrack.style.paddingLeft = `${gutter}px`;
    sliderTrack.style.paddingRight = `${gutter}px`;
    const slideLeft = activeSlide.offsetLeft;
    
    // Calculate offset to center the slide in the container
    const translateX = slideLeft - gutter;
    
    // Ensure we don't scroll past the edges
    const maxTranslate = Math.max(0, sliderTrack.scrollWidth - containerWidth);
    const finalTranslateX = Math.min(Math.max(translateX, 0), maxTranslate);
    
    sliderTrack.style.transform = `translateX(-${finalTranslateX}px)`;
}

function activateSlide(index) {
    if (!slides || slides.length === 0) {
        return;
    }
    if (index >= 0 && index < slides.length) {
        activeIndex = index;
        setActiveSlide(index);
    }
}

function centerGridImage(index) {
    if (!gridImages || !gridContent || gridImages.length === 0) {
        return;
    }
    const target = gridImages[index];
    const wrapper = document.querySelector('.grid-scroll');
    if (!target || !wrapper) {
        return;
    }

    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;
    const targetWidth = target.offsetWidth;
    const targetHeight = target.offsetHeight;
    let translateX = target.offsetLeft - (wrapperWidth / 2) + (targetWidth / 2);
    let translateY = target.offsetTop - (wrapperHeight / 2) + (targetHeight / 2);

    const maxTranslateX = Math.max(0, gridContent.scrollWidth - wrapperWidth);
    const maxTranslateY = Math.max(0, gridContent.scrollHeight - wrapperHeight);

    translateX = Math.min(Math.max(translateX, 0), maxTranslateX);
    translateY = Math.min(Math.max(translateY, 0), maxTranslateY);

    gridContent.style.transform = `translate3d(-${translateX}px, -${translateY}px, 0)`;
}

let gridSizeUpdateTimeout;
function updateGridSize(size) {
    const grid = document.getElementById('grid');
    if (grid) {
        // Clear any pending updates
        if (gridSizeUpdateTimeout) {
            clearTimeout(gridSizeUpdateTimeout);
        }
        
        // Update grid template columns with smooth transition
        //grid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${size}px, 1fr))`;
        // Set the width of all grid images to the new size
        const gridImages = document.querySelectorAll('.grid-img');
        gridImages.forEach(img => {
            img.style.width = `${size}px`;
        });

        // Save to localStorage
        localStorage.setItem('gridImageWidth', size.toString());

        // Re-center the active image after size change
        if (currentView === 'grid' && gridImages && gridImages.length > 0) {
            // Wait for CSS transition to complete before re-centering
            gridSizeUpdateTimeout = setTimeout(() => {
                centerGridImage(activeIndex);
            }, 350); // Wait for transition to complete (300ms + buffer)
        }
    }
}

function scheduleCommitCollapse() {
    if (currentView !== 'grid') {
        return;
    }
    clearTimeout(commitCollapseTimer);
    commitCollapseTimer = setTimeout(() => {
        if (currentView !== 'grid') {
            return;
        }
        const commitsList = document.getElementById('commits');
        if (commitsList) {
            commitsList.classList.add('collapsed');
        }
    }, COMMIT_COLLAPSE_DELAY);
}

function handleCommitListActivity() {
    const commitsList = document.getElementById('commits');
    if (!commitsList) {
        return;
    }
    if (commitsList.classList.contains('collapsed')) {
        commitsList.classList.remove('collapsed');
    }
    if (currentView === 'grid') {
        scheduleCommitCollapse();
    } else {
        clearTimeout(commitCollapseTimer);
    }
}

function resetCommitListCollapseState() {
    const commitsList = document.getElementById('commits');
    if (!commitsList) {
        return;
    }
    commitsList.classList.remove('collapsed');
    if (currentView === 'grid') {
        scheduleCommitCollapse();
    } else {
        clearTimeout(commitCollapseTimer);
    }
}

function setView(mode) {
    if (mode !== 'grid' && mode !== 'slider') {
        return;
    }
    currentView = mode;
    localStorage.setItem('tmViewMode', mode);
    document.body.classList.remove('view-grid', 'view-slider');
    document.body.classList.add(`view-${mode}`);
    document.querySelectorAll('.view-toggle-btn').forEach(button => {
        button.classList.toggle('active', button.getAttribute('data-view') === mode);
    });
    if (mode === 'slider') {
        setActiveSlide(activeIndex);
    } else if (mode === 'grid') {
        // Restore grid size from localStorage or slider value
        const gridSizeSlider = document.getElementById('gridSizeSlider');
        if (gridSizeSlider) {
            const savedWidth = localStorage.getItem('gridImageWidth');
            if (savedWidth) {
                const width = parseInt(savedWidth);
                gridSizeSlider.value = width;
                updateGridSize(width);
            } else {
                updateGridSize(parseInt(gridSizeSlider.value));
            }
        }
    }
    resetCommitListCollapseState();
}

