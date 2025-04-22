document.addEventListener('DOMContentLoaded', () => {
    // 初期データを修正
    let genres = [
        { id: 'apron', name: 'いるい', icon: 'apron.png' },
        { id: 'clean', name: 'せいけつ', icon: 'clean.png' },
        { id: 'pencil', name: 'ぶんぼうぐ', icon: 'pencil.png' },
        { id: 'textbook', name: 'ほん', icon: 'textbook.png' },
        { id: 'print', name: 'プリント', icon: 'print.png' }
    ];

    // localStorageからデータを読み込む
    let registeredItems = JSON.parse(localStorage.getItem('registeredItems') || '[]');
    let dailyItems = JSON.parse(localStorage.getItem('dailyItems') || JSON.stringify({
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: []
    }));

    // チェック状態だけをリセットする関数
    function resetChecks() {
        Object.keys(dailyItems).forEach(day => {
            if (dailyItems[day].length > 0) {  // アイテムが存在する場合のみ処理
                dailyItems[day] = dailyItems[day].map(item => ({
                    ...item,  // 既存のアイテム情報をすべて保持
                    checked: false  // チェックマークだけをリセット
                }));
            }
        });
        saveData();  // 変更を保存
    }

    // 起動時にチェックマークだけをリセット
    resetChecks();

    // データを保存する関数
    function saveData() {
        localStorage.setItem('registeredItems', JSON.stringify(registeredItems));
        localStorage.setItem('dailyItems', JSON.stringify(dailyItems));
    }

    let currentDay = 'monday';

    // DOM要素の取得
    const genreFilter = document.getElementById('genreFilter');
    const itemGenre = document.getElementById('itemGenre');
    const registeredItemsContainer = document.getElementById('registeredItems');
    const dailyItemsContainer = document.getElementById('dailyItems');

    // ジャンルの初期化
    function initializeGenres() {
        genreFilter.innerHTML = `
            <option value="all">すべて</option>
            ${genres.map(genre => `<option value="${genre.id}">${genre.name}</option>`).join('')}
        `;
        itemGenre.innerHTML = genres.map(genre => 
            `<option value="${genre.id}">${genre.name}</option>`
        ).join('');
    }

    // 登録済みアイテムの表示を更新
    function updateRegisteredItems(filterGenre = 'all') {
        registeredItemsContainer.innerHTML = registeredItems
            .filter(item => filterGenre === 'all' || item.genre === filterGenre)
            .map(item => {
                const genre = genres.find(g => g.id === item.genre);
                // スマホ用のタップイベントを追加
                return `
                    <div class="item" draggable="true" data-id="${item.id}" onclick="addToDaily('${item.id}')">
                        <div class="item-left">
                            <img src="assets/icons/${genre.icon}" class="genre-icon" alt="${genre.name}">
                            ${item.name}
                        </div>
                        <button class="remove-btn" onclick="removeFromRegistered('${item.id}', event)">×</button>
                    </div>
                `;
            }).join('');
        addDragListeners();
    }

    // 日別持ち物リストの表示を更新
    function updateDailyItems() {
        const items = dailyItems[currentDay];
        dailyItemsContainer.innerHTML = items
            .map(item => {
                const genre = genres.find(g => g.id === item.genre);
                return `
                    <div class="item" draggable="true" data-id="${item.id}">
                        <div class="item-left">
                            <div class="checkbox" onclick="toggleCheck('${item.id}')">${item.checked ? '✓' : ''}</div>
                            <img src="assets/icons/${genre.icon}" class="genre-icon" alt="${genre.name}">
                            ${item.name}
                        </div>
                        <button class="remove-btn" onclick="removeFromDaily('${item.id}')">×</button>
                    </div>
                `;
            }).join('');
        
        // 全てのアイテムがチェックされているか確認
        if (items.length > 0 && items.every(item => item.checked)) {
            dailyItemsContainer.innerHTML += `
                <div class="perfect-message">かんぺき！</div>
            `;
        }
    }

    // ドラッグ&ドロップ機能を修正
    function addDragListeners() {
        const items = document.querySelectorAll('.item');
        
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
                item.classList.add('dragging');
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
        });

        dailyItemsContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        dailyItemsContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            const itemId = e.dataTransfer.getData('text/plain');
            const item = registeredItems.find(i => i.id === itemId);
            const currentItems = dailyItems[currentDay];
            
            if (item && !currentItems.find(i => i.id === itemId)) {
                if (currentItems.length >= 10) {
                    alert('持ち物リストは最大10個までです');
                    return;
                }
                dailyItems[currentDay].push({...item});
                updateDailyItems();
                saveData();
            }
        });
    }

    // アイテム削除機能をグローバルスコープに追加
    window.removeFromDaily = function(itemId) {
        dailyItems[currentDay] = dailyItems[currentDay].filter(item => item.id !== itemId);
        updateDailyItems();
        saveData(); // データを保存
    };

    // アイテム追加ボタンのイベントリスナーを修正
    document.getElementById('addItemBtn').addEventListener('click', () => {
        const name = document.getElementById('itemName').value.trim();
        const genre = itemGenre.value;
        if (name) {
            const newItem = {
                id: Date.now().toString(),
                name,
                genre
            };
            registeredItems.push(newItem);
            document.getElementById('itemName').value = '';
            updateRegisteredItems(genreFilter.value);
            saveData(); // データを保存
        }
    });

    // ジャンルフィルターのイベントリスナーを修正
    genreFilter.addEventListener('change', (e) => {
        updateRegisteredItems(e.target.value);
    });

    // 曜日タブの切り替え
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelector('.tab-button.active').classList.remove('active');
            button.classList.add('active');
            currentDay = button.dataset.day;
            updateDailyItems();
        });
    });

    // 登録済みアイテムの削除機能を追加
    window.removeFromRegistered = function(itemId, event) {
        if (event) {
            event.stopPropagation();  // クリックイベントの伝播を停止
        }
        registeredItems = registeredItems.filter(item => item.id !== itemId);
        updateRegisteredItems(genreFilter.value);
        saveData();
    };

    // チェックボックスのトグル機能
    window.toggleCheck = function(itemId) {
        const item = dailyItems[currentDay].find(item => item.id === itemId);
        if (item) {
            item.checked = !item.checked;
            updateDailyItems();
            saveData();
        }
    };

    // 表示/非表示の状態を保存
    let isRegisteredItemsVisible = true;

    // 切り替えボタンのイベントリスナーを追加
    document.getElementById('toggleRegisteredItems').addEventListener('click', () => {
        const container = document.getElementById('registeredItemsContainer');
        isRegisteredItemsVisible = !isRegisteredItemsVisible;
        
        if (isRegisteredItemsVisible) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
        
        // 状態を保存
        localStorage.setItem('isRegisteredItemsVisible', isRegisteredItemsVisible);
    });

    // 保存された表示/非表示の状態を復元
    const savedVisibility = localStorage.getItem('isRegisteredItemsVisible');
    if (savedVisibility === 'false') {
        isRegisteredItemsVisible = false;
        document.getElementById('registeredItemsContainer').classList.add('hidden');
    }

    // タップで追加する関数を追加
    window.addToDaily = function(itemId) {
        // スマホの場合のみ実行（タッチデバイスの判定）
        if ('ontouchstart' in window) {
            const item = registeredItems.find(i => i.id === itemId);
            const currentItems = dailyItems[currentDay];
            
            if (item && !currentItems.find(i => i.id === itemId)) {
                if (currentItems.length >= 10) {
                    alert('持ち物リストは最大10個までです');
                    return;
                }
                dailyItems[currentDay].push({...item, checked: false});
                updateDailyItems();
                saveData();
            }
        }
    };

    // 初期化
    initializeGenres();
    updateRegisteredItems();
    updateDailyItems();
}); 