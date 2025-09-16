/**
 * 트로피 보상 시스템
 */
class TrophyRewardSystem {
    constructor() {
        this.trophyRewards = this.initializeTrophyRewards();
        this.unlockedRewards = this.loadUnlockedRewards();
        this.init();
    }

    /**
     * 초기화
     */
    init() {
        this.setupEventListeners();
        this.checkTrophyRewards();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'trophy-rewards-btn') {
                this.showTrophyRewardsModal();
            }
            
            if (e.target.id === 'close-trophy-rewards-modal') {
                this.closeTrophyRewardsModal();
            }
        });
    }

    /**
     * 트로피 보상 초기화
     */
    initializeTrophyRewards() {
        return {
            // 게임 완료 트로피 보상
            'first_win_trophy': {
                id: 'first_win_trophy',
                name: '첫 승리 트로피',
                description: '첫 번째 게임 완료 시 획득',
                icon: '🎉',
                requiredTrophies: ['first_win'],
                reward: 'unlock_extra_hint',
                rewardDescription: '게임당 힌트 1회 추가',
                unlocked: false
            },
            'speed_demon_trophy': {
                id: 'speed_demon_trophy',
                name: '속도의 악마 트로피',
                description: '5분 이내 게임 완료 시 획득',
                icon: '⚡',
                requiredTrophies: ['speed_demon'],
                reward: 'unlock_time_freeze',
                rewardDescription: '시간 정지 기능 해제',
                unlocked: false
            },
            'perfectionist_trophy': {
                id: 'perfectionist_trophy',
                name: '완벽주의자 트로피',
                description: '실수 없이 게임 완료 시 획득',
                icon: '💎',
                requiredTrophies: ['perfectionist'],
                reward: 'unlock_mistake_forgive',
                rewardDescription: '실수 용서 기능 해제',
                unlocked: false
            },
            'hint_master_trophy': {
                id: 'hint_master_trophy',
                name: '힌트 마스터 트로피',
                description: '힌트 없이 게임 완료 시 획득',
                icon: '🧠',
                requiredTrophies: ['hint_master'],
                reward: 'unlock_smart_hint_plus',
                rewardDescription: '고급 스마트 힌트 해제',
                unlocked: false
            },

            // 연속 달성 트로피 보상
            'streak_7_trophy': {
                id: 'streak_7_trophy',
                name: '일주일 연속 트로피',
                description: '7일 연속 게임 완료 시 획득',
                icon: '📅',
                requiredTrophies: ['daily_7'],
                reward: 'unlock_daily_bonus',
                rewardDescription: '일일 보너스 포인트 2배',
                unlocked: false
            },
            'streak_30_trophy': {
                id: 'streak_30_trophy',
                name: '한 달 연속 트로피',
                description: '30일 연속 게임 완료 시 획득',
                icon: '🗓️',
                requiredTrophies: ['daily_30'],
                reward: 'unlock_premium_themes',
                rewardDescription: '프리미엄 테마 해제',
                unlocked: false
            },

            // 난이도별 트로피 보상
            'hard_master_trophy': {
                id: 'hard_master_trophy',
                name: '어려움 마스터 트로피',
                description: '어려움 난이도 10회 완료 시 획득',
                icon: '🔥',
                requiredTrophies: ['hard_legend'],
                reward: 'unlock_insane_difficulty',
                rewardDescription: '극한 난이도 해제',
                unlocked: false
            },

            // 특별 트로피 보상
            'night_owl_trophy': {
                id: 'night_owl_trophy',
                name: '올빼미 트로피',
                description: '새벽 시간대 게임 완료 시 획득',
                icon: '🦉',
                requiredTrophies: ['night_owl'],
                reward: 'unlock_dark_mode_plus',
                rewardDescription: '고급 다크 모드 해제',
                unlocked: false
            },
            'early_bird_trophy': {
                id: 'early_bird_trophy',
                name: '일찍 일어나는 새 트로피',
                description: '아침 시간대 게임 완료 시 획득',
                icon: '🐦',
                requiredTrophies: ['early_bird'],
                reward: 'unlock_morning_boost',
                rewardDescription: '아침 부스터 해제',
                unlocked: false
            },

            // 종합 트로피 보상
            'grand_master_trophy': {
                id: 'grand_master_trophy',
                name: '그랜드 마스터 트로피',
                description: '모든 기본 업적 달성 시 획득',
                icon: '👑',
                requiredTrophies: ['first_win', 'win_10', 'speed_demon', 'perfectionist', 'hint_master'],
                reward: 'unlock_grand_master_mode',
                rewardDescription: '그랜드 마스터 모드 해제',
                unlocked: false
            }
        };
    }

    /**
     * 해제된 보상 로드
     */
    loadUnlockedRewards() {
        try {
            return JSON.parse(localStorage.getItem('sudoku_unlocked_rewards') || '[]');
        } catch (error) {
            console.error('해제된 보상 로드 실패:', error);
            return [];
        }
    }

    /**
     * 해제된 보상 저장
     */
    saveUnlockedRewards() {
        try {
            localStorage.setItem('sudoku_unlocked_rewards', JSON.stringify(this.unlockedRewards));
        } catch (error) {
            console.error('해제된 보상 저장 실패:', error);
        }
    }

    /**
     * 트로피 보상 체크
     */
    checkTrophyRewards() {
        const trophies = this.getTrophies();
        const newRewards = [];

        Object.values(this.trophyRewards).forEach(reward => {
            if (this.unlockedRewards.includes(reward.id)) {
                return; // 이미 해제된 보상
            }

            // 필요한 트로피를 모두 보유했는지 확인
            const hasAllTrophies = reward.requiredTrophies.every(trophyId => 
                trophies.some(trophy => trophy.id === trophyId)
            );

            if (hasAllTrophies) {
                this.unlockedRewards.push(reward.id);
                newRewards.push(reward);
                this.applyReward(reward);
            }
        });

        if (newRewards.length > 0) {
            this.saveUnlockedRewards();
            this.showNewRewards(newRewards);
        }
    }

    /**
     * 트로피 목록 가져오기
     */
    getTrophies() {
        try {
            return JSON.parse(localStorage.getItem('sudoku_trophies') || '[]');
        } catch (error) {
            console.error('트로피 로드 실패:', error);
            return [];
        }
    }

    /**
     * 보상 적용
     */
    applyReward(reward) {
        switch (reward.reward) {
            case 'unlock_extra_hint':
                this.unlockExtraHint();
                break;
            case 'unlock_time_freeze':
                this.unlockTimeFreeze();
                break;
            case 'unlock_mistake_forgive':
                this.unlockMistakeForgive();
                break;
            case 'unlock_smart_hint_plus':
                this.unlockSmartHintPlus();
                break;
            case 'unlock_daily_bonus':
                this.unlockDailyBonus();
                break;
            case 'unlock_premium_themes':
                this.unlockPremiumThemes();
                break;
            case 'unlock_insane_difficulty':
                this.unlockInsaneDifficulty();
                break;
            case 'unlock_dark_mode_plus':
                this.unlockDarkModePlus();
                break;
            case 'unlock_morning_boost':
                this.unlockMorningBoost();
                break;
            case 'unlock_grand_master_mode':
                this.unlockGrandMasterMode();
                break;
        }
    }

    /**
     * 추가 힌트 해제
     */
    unlockExtraHint() {
        // 게임 로직에서 힌트 횟수 증가
        if (window.sudokuGame) {
            window.sudokuGame.extraHints = (window.sudokuGame.extraHints || 0) + 1;
        }
    }

    /**
     * 시간 정지 해제
     */
    unlockTimeFreeze() {
        // 시간 정지 기능 활성화
        if (window.sudokuGame) {
            window.sudokuGame.timeFreezeEnabled = true;
        }
    }

    /**
     * 실수 용서 해제
     */
    unlockMistakeForgive() {
        // 실수 용서 기능 활성화
        if (window.sudokuGame) {
            window.sudokuGame.mistakeForgiveEnabled = true;
        }
    }

    /**
     * 고급 스마트 힌트 해제
     */
    unlockSmartHintPlus() {
        // 스마트 힌트 시스템 업그레이드
        if (window.smartHintSystem) {
            window.smartHintSystem.enhancedMode = true;
        }
    }

    /**
     * 일일 보너스 해제
     */
    unlockDailyBonus() {
        // 일일 도전 보너스 포인트 2배
        if (window.dailyChallenge) {
            window.dailyChallenge.bonusMultiplier = 2;
        }
    }

    /**
     * 프리미엄 테마 해제
     */
    unlockPremiumThemes() {
        // 상점에 프리미엄 테마 추가
        if (window.shopSystem) {
            window.shopSystem.unlockPremiumThemes();
        }
    }

    /**
     * 극한 난이도 해제
     */
    unlockInsaneDifficulty() {
        // 새로운 난이도 옵션 추가
        if (window.sudokuGame) {
            window.sudokuGame.insaneDifficultyEnabled = true;
        }
    }

    /**
     * 고급 다크 모드 해제
     */
    unlockDarkModePlus() {
        // 고급 다크 모드 테마 추가
        this.addThemeCSS('dark-plus', `
            body[data-theme="dark-plus"] {
                background: linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a2a2a);
                color: #ffffff;
            }
            
            body[data-theme="dark-plus"] .cell {
                background-color: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #ffffff;
            }
            
            body[data-theme="dark-plus"] .cell.selected {
                background-color: rgba(0, 255, 255, 0.2);
                border-color: #00ffff;
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
            }
        `);
    }

    /**
     * 아침 부스터 해제
     */
    unlockMorningBoost() {
        // 아침 시간대 포인트 부스터
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 10) {
            if (window.achievementSystem) {
                window.achievementSystem.morningBoost = true;
            }
        }
    }

    /**
     * 그랜드 마스터 모드 해제
     */
    unlockGrandMasterMode() {
        // 특별한 게임 모드 해제
        if (window.sudokuGame) {
            window.sudokuGame.grandMasterMode = true;
        }
    }

    /**
     * 새 보상 표시
     */
    showNewRewards(rewards) {
        const modal = document.createElement('div');
        modal.className = 'modal trophy-reward-notification';
        modal.id = 'trophy-reward-notification-modal';
        
        let rewardsHTML = rewards.map(reward => `
            <div class="trophy-reward-notification-item">
                <div class="reward-icon">${reward.icon}</div>
                <div class="reward-info">
                    <h3 class="reward-title">${reward.name}</h3>
                    <p class="reward-description">${reward.rewardDescription}</p>
                    <div class="reward-unlocked">🎉 해제됨!</div>
                </div>
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content trophy-reward-modal-content">
                <div class="modal-header">
                    <h2>🏆 새로운 보상 해제!</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="trophy-rewards-notification-list">
                    ${rewardsHTML}
                </div>
                <div class="modal-buttons">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">확인</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.showModal('trophy-reward-notification-modal');
        
        // 3초 후 자동 닫기
        setTimeout(() => {
            const modal = document.getElementById('trophy-reward-notification-modal');
            if (modal) {
                modal.remove();
            }
        }, 5000);
    }

    /**
     * 트로피 보상 모달 표시
     */
    showTrophyRewardsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'trophy-rewards-modal';
        
        const rewards = Object.values(this.trophyRewards);
        let rewardsHTML = rewards.map(reward => {
            const isUnlocked = this.unlockedRewards.includes(reward.id);
            const canUnlock = this.canUnlockReward(reward);
            
            return `
                <div class="trophy-reward-item ${isUnlocked ? 'unlocked' : ''}">
                    <div class="reward-icon">${reward.icon}</div>
                    <div class="reward-info">
                        <h3 class="reward-title">${reward.name}</h3>
                        <p class="reward-description">${reward.description}</p>
                        <div class="reward-benefit">${reward.rewardDescription}</div>
                        <div class="reward-requirements">
                            필요 트로피: ${reward.requiredTrophies.join(', ')}
                        </div>
                    </div>
                    <div class="reward-status">
                        ${isUnlocked ? '✅ 해제됨' : canUnlock ? '🔓 해제 가능' : '🔒 잠김'}
                    </div>
                </div>
            `;
        }).join('');

        modal.innerHTML = `
            <div class="modal-content trophy-rewards-modal-content">
                <div class="modal-header">
                    <h2>🏆 트로피 보상</h2>
                    <button class="close-btn" id="close-trophy-rewards-modal">×</button>
                </div>
                <div class="trophy-rewards-summary">
                    <div class="summary-item">
                        <span class="summary-label">해제된 보상:</span>
                        <span class="summary-value">${this.unlockedRewards.length}/${rewards.length}</span>
                    </div>
                </div>
                <div class="trophy-rewards-list">
                    ${rewardsHTML}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.showModal('trophy-rewards-modal');
        
        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeTrophyRewardsModal();
            }
        });
        
        // ESC 키로 닫기
        this.handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeTrophyRewardsModal();
            }
        };
        document.addEventListener('keydown', this.handleEsc);
    }

    /**
     * 보상 해제 가능 여부 확인
     */
    canUnlockReward(reward) {
        const trophies = this.getTrophies();
        return reward.requiredTrophies.every(trophyId => 
            trophies.some(trophy => trophy.id === trophyId)
        );
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
     * 트로피 보상 모달 닫기
     */
    closeTrophyRewardsModal() {
        const modal = document.getElementById('trophy-rewards-modal');
        if (modal) {
            modal.remove();
        }
        if (this.handleEsc) {
            document.removeEventListener('keydown', this.handleEsc);
        }
    }

    /**
     * 보상 해제 여부 확인
     */
    isRewardUnlocked(rewardId) {
        return this.unlockedRewards.includes(rewardId);
    }
}

// 전역 인스턴스 생성
window.trophyRewardSystem = new TrophyRewardSystem();
