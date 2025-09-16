/**
 * 테마 관리 시스템
 */
class ThemeManager {
    constructor() {
        this.currentTheme = this.loadCurrentTheme();
        this.purchasedThemes = this.loadPurchasedThemes();
        this.init();
    }

    /**
     * 초기화
     */
    init() {
        console.log('테마 매니저 초기화 시작');
        console.log('현재 테마:', this.currentTheme);
        console.log('구매한 테마:', this.purchasedThemes);
        
        this.setupEventListeners();
        this.applyTheme(this.currentTheme);
        this.updateThemeSelection(this.currentTheme);
        this.updatePurchasedThemesDisplay();
        
        console.log('테마 매니저 초기화 완료');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-btn') || e.target.closest('.purchased-theme-btn')) {
                const themeBtn = e.target.closest('.theme-btn') || e.target.closest('.purchased-theme-btn');
                const theme = themeBtn.dataset.theme;
                this.selectTheme(theme);
            }
        });

        // 설정 모달이 열릴 때 구매한 테마 업데이트
        document.addEventListener('click', (e) => {
            if (e.target.id === 'settings-btn') {
                setTimeout(() => {
                    this.updatePurchasedThemesDisplay();
                }, 100);
            }
            
            // 기본 테마 복원 버튼
            if (e.target.id === 'reset-theme-btn') {
                this.resetToDefaultTheme();
            }
        });
    }

    /**
     * 현재 테마 로드
     */
    loadCurrentTheme() {
        try {
            return localStorage.getItem('sudoku_current_theme') || 'light';
        } catch (error) {
            console.error('테마 로드 실패:', error);
            return 'light';
        }
    }

    /**
     * 현재 테마 저장
     */
    saveCurrentTheme(theme) {
        try {
            localStorage.setItem('sudoku_current_theme', theme);
        } catch (error) {
            console.error('테마 저장 실패:', error);
        }
    }

    /**
     * 구매한 테마 로드
     */
    loadPurchasedThemes() {
        try {
            return JSON.parse(localStorage.getItem('sudoku_purchased_items') || '[]');
        } catch (error) {
            console.error('구매한 테마 로드 실패:', error);
            return [];
        }
    }

    /**
     * 테마 선택
     */
    selectTheme(theme) {
        console.log('테마 선택 시작:', theme);
        
        // 기본 테마인지 확인
        const basicThemes = ['light', 'dark', 'blue', 'green'];
        const isBasicTheme = basicThemes.includes(theme);
        console.log('기본 테마 여부:', isBasicTheme);
        
        // 구매한 테마인지 확인
        const isPurchasedTheme = this.purchasedThemes.includes(theme);
        console.log('구매한 테마 여부:', isPurchasedTheme);
        console.log('구매한 테마 목록:', this.purchasedThemes);
        
        if (!isBasicTheme && !isPurchasedTheme) {
            console.log('테마 구매하지 않음, 선택 취소');
            this.showToast('이 테마를 구매하지 않았습니다.');
            return;
        }

        console.log('테마 선택 진행');
        this.currentTheme = theme;
        this.saveCurrentTheme(theme);
        this.applyTheme(theme);
        this.updateThemeSelection(theme);
        
        // UI 설정도 함께 업데이트
        this.updateUISettings(theme);
        
        this.showToast(`${this.getThemeName(theme)} 테마로 변경되었습니다.`);
        console.log('테마 선택 완료:', theme);
    }

    /**
     * UI 설정 업데이트
     */
    updateUISettings(theme) {
        try {
            // 현재 설정을 로드
            let settings = {};
            if (window.gameStorage) {
                settings = window.gameStorage.loadSettings() || {};
            } else {
                const savedSettings = localStorage.getItem('sudokuSettings');
                settings = savedSettings ? JSON.parse(savedSettings) : {};
            }
            
            // 테마 설정 업데이트
            settings.theme = theme;
            
            // 설정 저장
            if (window.gameStorage) {
                window.gameStorage.saveSettings(settings);
            } else {
                localStorage.setItem('sudokuSettings', JSON.stringify(settings));
            }
            
            console.log('UI 설정 업데이트됨:', settings);
        } catch (error) {
            console.error('UI 설정 업데이트 중 오류:', error);
        }
    }

    /**
     * 테마 적용
     */
    applyTheme(theme) {
        console.log('테마 적용 시작:', theme);
        
        // 기존 테마 클래스 제거
        document.body.removeAttribute('data-theme');
        console.log('기존 data-theme 속성 제거됨');
        
        // 모든 테마에 대해 data-theme 속성 설정
        document.body.setAttribute('data-theme', theme);
        console.log('새 data-theme 속성 설정됨:', document.body.getAttribute('data-theme'));
        
        // 인라인 스타일 제거 (CSS가 우선 적용되도록)
        document.body.style.background = '';
        console.log('인라인 배경 스타일 제거됨');
        
        console.log('테마 적용 완료:', theme);
    }

    /**
     * 테마 선택 UI 업데이트
     */
    updateThemeSelection(selectedTheme) {
        // 모든 테마 버튼에서 selected 클래스 제거
        document.querySelectorAll('.theme-btn, .purchased-theme-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // 선택된 테마 버튼에 selected 클래스 추가
        const selectedBtn = document.querySelector(`[data-theme="${selectedTheme}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
    }

    /**
     * 구매한 테마 표시 업데이트
     */
    updatePurchasedThemesDisplay() {
        const purchasedThemesSection = document.getElementById('purchased-themes-section');
        const purchasedThemeOptions = document.getElementById('purchased-theme-options');
        
        if (!purchasedThemesSection || !purchasedThemeOptions) {
            return;
        }

        // 구매한 테마 목록 가져오기
        const purchasedThemes = this.getPurchasedThemes();
        
        if (purchasedThemes.length === 0) {
            purchasedThemesSection.style.display = 'none';
            return;
        }

        // 구매한 테마 섹션 표시
        purchasedThemesSection.style.display = 'block';

        // 구매한 테마 버튼들 생성
        let themeButtonsHTML = '';
        purchasedThemes.forEach(theme => {
            const themeInfo = this.getThemeInfo(theme);
            const isSelected = this.currentTheme === theme;
            
            themeButtonsHTML += `
                <button class="theme-btn purchased-theme-btn ${isSelected ? 'selected' : ''}" data-theme="${theme}">
                    <span class="theme-icon">${themeInfo.icon}</span>
                    <span>${themeInfo.name}</span>
                    <span class="purchased-badge">구매함</span>
                </button>
            `;
        });

        purchasedThemeOptions.innerHTML = themeButtonsHTML;
    }

    /**
     * 구매한 테마 목록 가져오기
     */
    getPurchasedThemes() {
        const themeItems = ['theme_rainbow', 'theme_neon', 'theme_forest'];
        return this.purchasedThemes.filter(item => themeItems.includes(item));
    }

    /**
     * 테마 정보 가져오기
     */
    getThemeInfo(themeId) {
        const themeInfo = {
            'theme_rainbow': {
                name: '무지개',
                icon: '🌈'
            },
            'theme_neon': {
                name: '네온',
                icon: '💫'
            },
            'theme_forest': {
                name: '숲',
                icon: '🌲'
            },
            'light': {
                name: '라이트',
                icon: '☀️'
            },
            'dark': {
                name: '다크',
                icon: '🌙'
            },
            'blue': {
                name: '블루',
                icon: '💙'
            },
            'green': {
                name: '그린',
                icon: '💚'
            }
        };
        
        return themeInfo[themeId] || { name: themeId, icon: '🎨' };
    }

    /**
     * 테마 이름 가져오기
     */
    getThemeName(themeId) {
        return this.getThemeInfo(themeId).name;
    }

    /**
     * 구매한 테마 추가 (상점에서 구매 시 호출)
     */
    addPurchasedTheme(themeId) {
        if (!this.purchasedThemes.includes(themeId)) {
            this.purchasedThemes.push(themeId);
            this.updatePurchasedThemesDisplay();
        }
    }

    /**
     * 테마 미리보기
     */
    previewTheme(theme) {
        // 미리보기용 임시 테마 적용
        const originalTheme = this.currentTheme;
        this.applyTheme(theme);
        
        // 3초 후 원래 테마로 복원
        setTimeout(() => {
            this.applyTheme(originalTheme);
        }, 3000);
    }

    /**
     * 기본 테마로 복원
     */
    resetToDefaultTheme() {
        this.selectTheme('light');
        this.showToast('기본 테마로 복원되었습니다.');
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
     * 현재 테마 가져오기
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * 구매한 테마 목록 가져오기
     */
    getPurchasedThemesList() {
        return this.purchasedThemes;
    }
}

// 전역 인스턴스 생성
window.themeManager = new ThemeManager();
