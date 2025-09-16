/**
 * 상점 시스템
 */
class ShopSystem {
    constructor() {
        this.items = this.initializeShopItems();
        this.purchasedItems = this.loadPurchasedItems();
        this.init();
    }

    /**
     * 초기화
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'shop-btn') {
                this.showShopModal();
            }
            
            if (e.target.id === 'close-shop-modal') {
                this.closeShopModal();
            }

            if (e.target.classList.contains('purchase-btn')) {
                const itemId = e.target.dataset.itemId;
                this.purchaseItem(itemId);
            }
        });
    }

    /**
     * 상점 아이템 초기화
     */
    initializeShopItems() {
        return {
            // 테마 아이템
            'theme_rainbow': {
                id: 'theme_rainbow',
                name: '무지개 테마',
                description: '화려한 무지개 색상의 테마',
                icon: '🌈',
                category: 'theme',
                price: 100,
                rarity: 'uncommon',
                effect: 'rainbow_theme'
            },
            'theme_neon': {
                id: 'theme_neon',
                name: '네온 테마',
                description: '미래적인 네온 색상의 테마',
                icon: '💫',
                category: 'theme',
                price: 150,
                rarity: 'rare',
                effect: 'neon_theme'
            },
            'theme_forest': {
                id: 'theme_forest',
                name: '숲 테마',
                description: '자연스러운 녹색 숲 테마',
                icon: '🌲',
                category: 'theme',
                price: 80,
                rarity: 'common',
                effect: 'forest_theme'
            },

            // 힌트 아이템
            'hint_boost': {
                id: 'hint_boost',
                name: '힌트 부스터',
                description: '게임당 힌트 1회 추가',
                icon: '💡',
                category: 'boost',
                price: 50,
                rarity: 'common',
                effect: 'extra_hint',
                consumable: true
            },
            'smart_hint_plus': {
                id: 'smart_hint_plus',
                name: '스마트 힌트+',
                description: '더 정확한 스마트 힌트',
                icon: '🧠',
                category: 'boost',
                price: 200,
                rarity: 'rare',
                effect: 'enhanced_smart_hint',
                permanent: true
            },

            // 커스터마이징 아이템
            'board_glow': {
                id: 'board_glow',
                name: '보드 글로우',
                description: '게임 보드에 빛나는 효과',
                icon: '✨',
                category: 'customization',
                price: 120,
                rarity: 'uncommon',
                effect: 'board_glow_effect',
                permanent: true
            },
            'number_animation': {
                id: 'number_animation',
                name: '숫자 애니메이션',
                description: '숫자 입력 시 특별한 애니메이션',
                icon: '🎭',
                category: 'customization',
                price: 180,
                rarity: 'rare',
                effect: 'number_animation',
                permanent: true
            },
            'sound_pack': {
                id: 'sound_pack',
                name: '프리미엄 사운드팩',
                description: '고품질 게임 사운드',
                icon: '🎵',
                category: 'customization',
                price: 100,
                rarity: 'uncommon',
                effect: 'premium_sounds',
                permanent: true
            },

            // 특별 아이템
            'time_freeze': {
                id: 'time_freeze',
                name: '시간 정지',
                description: '게임 시간을 30초 정지',
                icon: '⏸️',
                category: 'special',
                price: 75,
                rarity: 'uncommon',
                effect: 'freeze_time',
                consumable: true
            },
            'mistake_forgive': {
                id: 'mistake_forgive',
                name: '실수 용서',
                description: '실수 1회 무시',
                icon: '🛡️',
                category: 'special',
                price: 60,
                rarity: 'common',
                effect: 'forgive_mistake',
                consumable: true
            }
        };
    }

    /**
     * 구매한 아이템 로드
     */
    loadPurchasedItems() {
        try {
            return JSON.parse(localStorage.getItem('sudoku_purchased_items') || '[]');
        } catch (error) {
            console.error('구매 아이템 로드 실패:', error);
            return [];
        }
    }

    /**
     * 구매한 아이템 저장
     */
    savePurchasedItems() {
        try {
            localStorage.setItem('sudoku_purchased_items', JSON.stringify(this.purchasedItems));
        } catch (error) {
            console.error('구매 아이템 저장 실패:', error);
        }
    }

    /**
     * 상점 모달 표시
     */
    showShopModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'shop-modal';
        
        const categories = this.getItemsByCategory();
        let categoriesHTML = '';

        Object.keys(categories).forEach(category => {
            const categoryItems = categories[category];
            let categoryHTML = categoryItems.map(item => {
                const isPurchased = this.purchasedItems.includes(item.id);
                const canAfford = this.canAfford(item.price);
                
                return `
                    <div class="shop-item ${isPurchased ? 'purchased' : ''}">
                        <div class="item-icon">${item.icon}</div>
                        <div class="item-info">
                            <h3 class="item-title">${item.name}</h3>
                            <p class="item-description">${item.description}</p>
                            <div class="item-price">${item.price} 포인트</div>
                        </div>
                        <div class="item-actions">
                            ${isPurchased ? `
                                <span class="purchased-badge">구매완료</span>
                            ` : `
                                <button class="purchase-btn ${!canAfford ? 'disabled' : ''}" 
                                        data-item-id="${item.id}" 
                                        ${!canAfford ? 'disabled' : ''}>
                                    ${canAfford ? '구매' : '포인트 부족'}
                                </button>
                            `}
                        </div>
                    </div>
                `;
            }).join('');

            categoriesHTML += `
                <div class="shop-category">
                    <h3 class="category-title">${this.getCategoryTitle(category)}</h3>
                    <div class="category-items">
                        ${categoryHTML}
                    </div>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="modal-content shop-modal-content">
                <div class="modal-header">
                    <h2>🛒 상점</h2>
                    <button class="close-btn" id="close-shop-modal">×</button>
                </div>
                <div class="shop-summary">
                    <div class="summary-item">
                        <span class="summary-label">보유 포인트:</span>
                        <span class="summary-value">${this.getTotalPoints()}점</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">구매한 아이템:</span>
                        <span class="summary-value">${this.purchasedItems.length}개</span>
                    </div>
                </div>
                <div class="shop-categories">
                    ${categoriesHTML}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.showModal('shop-modal');
        
        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeShopModal();
            }
        });
        
        // ESC 키로 닫기
        this.handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeShopModal();
            }
        };
        document.addEventListener('keydown', this.handleEsc);
    }

    /**
     * 카테고리별 아이템 가져오기
     */
    getItemsByCategory() {
        const categories = {};
        
        Object.values(this.items).forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });

        return categories;
    }

    /**
     * 카테고리 제목 가져오기
     */
    getCategoryTitle(category) {
        const titles = {
            'theme': '🎨 테마',
            'boost': '⚡ 부스터',
            'customization': '✨ 커스터마이징',
            'special': '🎁 특별 아이템'
        };
        return titles[category] || category;
    }

    /**
     * 총 포인트 가져오기
     */
    getTotalPoints() {
        if (window.achievementSystem) {
            const achievementPoints = window.achievementSystem.getTotalPoints();
            const bonusPoints = window.achievementSystem.getBonusPoints();
            return achievementPoints + bonusPoints;
        }
        return 0;
    }

    /**
     * 구매 가능 여부 확인
     */
    canAfford(price) {
        return this.getTotalPoints() >= price;
    }

    /**
     * 포인트 차감
     */
    deductPoints(amount) {
        if (window.achievementSystem) {
            // 보너스 포인트에서 먼저 차감
            const bonusPoints = window.achievementSystem.getBonusPoints();
            if (bonusPoints >= amount) {
                // 보너스 포인트로 충분하면 보너스 포인트만 차감
                const newBonusPoints = bonusPoints - amount;
                localStorage.setItem('sudoku_bonus_points', newBonusPoints.toString());
                console.log(`보너스 포인트 ${amount}점 차감! 남은 보너스 포인트: ${newBonusPoints}점`);
            } else {
                // 보너스 포인트가 부족하면 보너스 포인트를 모두 차감하고 나머지는 업적 포인트에서 차감
                const remainingAmount = amount - bonusPoints;
                localStorage.setItem('sudoku_bonus_points', '0');
                
                // 업적 포인트에서 차감 (가장 최근 업적부터 차감)
                this.deductAchievementPoints(remainingAmount);
                
                console.log(`보너스 포인트 ${bonusPoints}점, 업적 포인트 ${remainingAmount}점 차감!`);
            }
        }
    }

    /**
     * 업적 포인트 차감 (가장 최근 업적부터)
     */
    deductAchievementPoints(amount) {
        if (!window.achievementSystem) return;
        
        const unlockedAchievements = window.achievementSystem.unlockedAchievements;
        let remainingAmount = amount;
        
        // 최근 업적부터 역순으로 차감
        for (let i = unlockedAchievements.length - 1; i >= 0 && remainingAmount > 0; i--) {
            const achievementId = unlockedAchievements[i];
            const achievement = window.achievementSystem.achievements[achievementId];
            
            if (achievement && achievement.points > 0) {
                const deductAmount = Math.min(achievement.points, remainingAmount);
                achievement.points -= deductAmount;
                remainingAmount -= deductAmount;
                
                // 포인트가 0이 되면 업적에서 제거
                if (achievement.points <= 0) {
                    unlockedAchievements.splice(i, 1);
                }
            }
        }
        
        // 업적 데이터 저장
        window.achievementSystem.saveAchievements();
    }

    /**
     * 아이템 구매
     */
    purchaseItem(itemId) {
        const item = this.items[itemId];
        if (!item) {
            this.showToast('아이템을 찾을 수 없습니다.');
            return;
        }

        if (this.purchasedItems.includes(itemId)) {
            this.showToast('이미 구매한 아이템입니다.');
            return;
        }

        if (!this.canAfford(item.price)) {
            this.showToast('포인트가 부족합니다.');
            return;
        }

        // 포인트 차감
        this.deductPoints(item.price);

        // 구매 처리
        this.purchasedItems.push(itemId);
        this.savePurchasedItems();

        // 테마 매니저에 구매한 테마 알림
        if (item.category === 'theme' && window.themeManager) {
            window.themeManager.addPurchasedTheme(itemId);
        }

        // 효과 적용
        this.applyItemEffect(item);

        this.showToast(`${item.name}을(를) 구매했습니다! (${item.price} 포인트 차감)`);
        
        // 상점 모달 새로고침
        this.closeShopModal();
        setTimeout(() => {
            this.showShopModal();
        }, 100);
    }

    /**
     * 아이템 효과 적용
     */
    applyItemEffect(item) {
        switch (item.effect) {
            case 'rainbow_theme':
                this.applyRainbowTheme();
                break;
            case 'neon_theme':
                this.applyNeonTheme();
                break;
            case 'forest_theme':
                this.applyForestTheme();
                break;
            case 'board_glow_effect':
                this.applyBoardGlow();
                break;
            case 'number_animation':
                this.applyNumberAnimation();
                break;
            case 'premium_sounds':
                this.applyPremiumSounds();
                break;
            // 다른 효과들은 게임 로직에서 처리
        }
    }

    /**
     * 무지개 테마 적용
     */
    applyRainbowTheme() {
        document.body.setAttribute('data-theme', 'rainbow');
        this.addThemeCSS('rainbow', `
            body[data-theme="rainbow"] {
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3);
                background-size: 400% 400%;
                animation: rainbowShift 8s ease infinite;
            }
            
            @keyframes rainbowShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            
            body[data-theme="rainbow"] .game-board {
                box-shadow: 0 0 30px rgba(255, 107, 107, 0.5);
            }
        `);
    }

    /**
     * 네온 테마 적용
     */
    applyNeonTheme() {
        document.body.setAttribute('data-theme', 'neon');
        this.addThemeCSS('neon', `
            body[data-theme="neon"] {
                background: linear-gradient(135deg, #0a0a0a, #1a1a2e, #16213e);
                color: #00ffff;
            }
            
            body[data-theme="neon"] .cell {
                background-color: rgba(0, 255, 255, 0.1);
                border: 1px solid #00ffff;
                color: #00ffff;
                text-shadow: 0 0 10px #00ffff;
            }
            
            body[data-theme="neon"] .cell.selected {
                background-color: rgba(255, 0, 255, 0.3);
                border-color: #ff00ff;
                box-shadow: 0 0 20px #ff00ff;
            }
        `);
    }

    /**
     * 숲 테마 적용
     */
    applyForestTheme() {
        document.body.setAttribute('data-theme', 'forest');
        this.addThemeCSS('forest', `
            body[data-theme="forest"] {
                background: linear-gradient(135deg, #2d5016, #3e6b1a, #4a7c1f);
            }
            
            body[data-theme="forest"] .cell {
                background-color: rgba(76, 124, 31, 0.2);
                border: 1px solid #4a7c1f;
                color: #2d5016;
            }
            
            body[data-theme="forest"] .cell.selected {
                background-color: rgba(76, 124, 31, 0.4);
                border-color: #2d5016;
            }
        `);
    }

    /**
     * 보드 글로우 효과 적용
     */
    applyBoardGlow() {
        const style = document.createElement('style');
        style.id = 'board-glow-effect';
        style.textContent = `
            .game-board.glow-effect {
                box-shadow: 0 0 50px rgba(46, 134, 171, 0.8), 0 0 100px rgba(46, 134, 171, 0.4);
                animation: boardGlow 2s ease-in-out infinite alternate;
            }
            
            @keyframes boardGlow {
                from { box-shadow: 0 0 50px rgba(46, 134, 171, 0.8), 0 0 100px rgba(46, 134, 171, 0.4); }
                to { box-shadow: 0 0 80px rgba(46, 134, 171, 1), 0 0 150px rgba(46, 134, 171, 0.6); }
            }
        `;
        document.head.appendChild(style);
        
        // 게임 보드에 클래스 추가
        const gameBoard = document.querySelector('.game-board');
        if (gameBoard) {
            gameBoard.classList.add('glow-effect');
        }
    }

    /**
     * 숫자 애니메이션 적용
     */
    applyNumberAnimation() {
        const style = document.createElement('style');
        style.id = 'number-animation-effect';
        style.textContent = `
            .cell.number-animation {
                animation: numberPop 0.3s ease-out;
            }
            
            @keyframes numberPop {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 프리미엄 사운드 적용
     */
    applyPremiumSounds() {
        // 오디오 매니저에 프리미엄 사운드 설정
        if (window.audioManager) {
            window.audioManager.enablePremiumSounds();
        }
    }

    /**
     * 테마 CSS 추가
     */
    addThemeCSS(themeName, css) {
        const style = document.createElement('style');
        style.id = `theme-${themeName}`;
        style.textContent = css;
        document.head.appendChild(style);
    }

    /**
     * 모달 표시
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
        }
    }

    /**
     * 상점 모달 닫기
     */
    closeShopModal() {
        const modal = document.getElementById('shop-modal');
        if (modal) {
            modal.remove();
        }
        if (this.handleEsc) {
            document.removeEventListener('keydown', this.handleEsc);
        }
    }

    /**
     * 토스트 메시지 표시
     */
    showToast(message) {
        if (window.uiManager && window.uiManager.showToast) {
            window.uiManager.showToast(message);
        } else {
            console.log(message);
        }
    }

    /**
     * 아이템 보유 여부 확인
     */
    hasItem(itemId) {
        return this.purchasedItems.includes(itemId);
    }

    /**
     * 소모품 사용
     */
    useConsumable(itemId) {
        if (!this.hasItem(itemId)) {
            return false;
        }

        const item = this.items[itemId];
        if (!item.consumable) {
            return true; // 영구 아이템은 항상 사용 가능
        }

        // 소모품은 사용 후 제거 (일회용)
        // 실제 구현에서는 게임 세션 동안만 유지
        return true;
    }
}

// 전역 인스턴스 생성
window.shopSystem = new ShopSystem();
