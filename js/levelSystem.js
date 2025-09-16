/**
 * 레벨 시스템
 * 사용자 레벨, 경험치, 칭호 관리
 */
class LevelSystem {
    constructor() {
        this.userProfile = {
            id: '',
            nickname: '',
            level: 1,
            experience: 0,
            totalPoints: 0,
            totalTrophies: 0,
            gamesCompleted: 0,
            consecutiveDays: 0,
            lastPlayDate: null,
            title: '초보자',
            joinDate: new Date().toISOString()
        };
        
        this.levelRequirements = [
            { level: 1, expRequired: 0, title: '초보자', color: '#95A5A6' },
            { level: 2, expRequired: 100, title: '학습자', color: '#3498DB' },
            { level: 3, expRequired: 250, title: '도전자', color: '#2ECC71' },
            { level: 4, expRequired: 500, title: '숙련자', color: '#F39C12' },
            { level: 5, expRequired: 800, title: '전문가', color: '#E74C3C' },
            { level: 6, expRequired: 1200, title: '마스터', color: '#9B59B6' },
            { level: 7, expRequired: 1700, title: '그랜드마스터', color: '#E67E22' },
            { level: 8, expRequired: 2300, title: '레전드', color: '#1ABC9C' },
            { level: 9, expRequired: 3000, title: '미스터리', color: '#34495E' },
            { level: 10, expRequired: 4000, title: '스도쿠의 신', color: '#F1C40F' }
        ];
        
        this.expRewards = {
            gameComplete: {
                easy: 10,
                medium: 20,
                hard: 30
            },
            achievement: 50,
            trophy: 100,
            consecutiveBonus: 25,
            dailyBonus: 15
        };
        
        this.levelRewards = {
            2: { points: 100, theme: null, title: '학습자' },
            3: { points: 200, theme: null, title: '도전자' },
            4: { points: 300, theme: null, title: '숙련자' },
            5: { points: 500, theme: 'theme_rainbow', title: '전문가' },
            6: { points: 750, theme: null, title: '마스터' },
            7: { points: 1000, theme: 'theme_neon', title: '그랜드마스터' },
            8: { points: 1500, theme: null, title: '레전드' },
            9: { points: 2000, theme: 'theme_forest', title: '미스터리' },
            10: { points: 3000, theme: 'theme_legendary', title: '스도쿠의 신' }
        };
    }

    /**
     * 초기화
     */
    init() {
        console.log('레벨 시스템 초기화 시작');
        this.loadUserProfile();
        this.setupEventListeners();
        this.updateProfileDisplay();
        console.log('레벨 시스템 초기화 완료');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        console.log('레벨 시스템 이벤트 리스너 설정 중...');
        // 모든 클릭 이벤트를 하나의 리스너로 통합
        document.addEventListener('click', (e) => {
            console.log('클릭된 요소:', e.target);
            console.log('클릭된 요소 ID:', e.target.id);
            console.log('클릭된 요소 클래스:', e.target.className);
            
            // 프로필 버튼 클릭
            if (e.target.id === 'profile-btn') {
                this.showProfileModal();
                return;
            }
            
            // 설정 버튼 클릭 시 프로필 정보 업데이트
            if (e.target.id === 'settings-btn') {
                setTimeout(() => {
                    this.updateSettingsProfileDisplay();
                }, 100);
                return;
            }
            
            // 닉네임 변경 버튼 클릭 (여러 방법으로 체크)
            if (e.target.id === 'change-nickname-btn' || 
                e.target.closest('#change-nickname-btn') ||
                e.target.textContent === '닉네임 변경') {
                console.log('닉네임 변경 버튼 클릭됨');
                e.preventDefault();
                e.stopPropagation();
                this.showNicknameChangeModal();
                return;
            }
            
            // 프로필 초기화 버튼 클릭 (여러 방법으로 체크)
            if (e.target.id === 'reset-profile-btn' || 
                e.target.closest('#reset-profile-btn') ||
                e.target.textContent === '프로필 초기화') {
                console.log('프로필 초기화 버튼 클릭됨');
                e.preventDefault();
                e.stopPropagation();
                this.showProfileResetModal();
                return;
            }
        });
    }

    /**
     * 사용자 프로필 로드
     */
    loadUserProfile() {
        try {
            const savedProfile = localStorage.getItem('sudoku_user_profile');
            if (savedProfile) {
                this.userProfile = { ...this.userProfile, ...JSON.parse(savedProfile) };
            }
            
            // 첫 방문자인 경우 프로필 설정 모달 표시
            if (!this.userProfile.id) {
                this.showProfileSetupModal();
            }
            
            console.log('사용자 프로필 로드됨:', this.userProfile);
        } catch (error) {
            console.error('프로필 로드 중 오류:', error);
        }
    }

    /**
     * 사용자 프로필 저장
     */
    saveUserProfile() {
        try {
            localStorage.setItem('sudoku_user_profile', JSON.stringify(this.userProfile));
            console.log('사용자 프로필 저장됨:', this.userProfile);
        } catch (error) {
            console.error('프로필 저장 중 오류:', error);
        }
    }

    /**
     * 프로필 설정 모달 표시
     */
    showProfileSetupModal() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🎮 프로필 설정</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="profile-setup">
                        <div class="input-group">
                            <label for="user-id">사용자 ID:</label>
                            <input type="text" id="user-id" placeholder="영문, 숫자만 가능" maxlength="20">
                        </div>
                        <div class="input-group">
                            <label for="user-nickname">별명:</label>
                            <input type="text" id="user-nickname" placeholder="게임에서 사용할 별명" maxlength="15">
                        </div>
                        <div class="profile-preview">
                            <h4>프로필 미리보기</h4>
                            <div class="profile-card">
                                <div class="profile-info">
                                    <span class="profile-id">ID: <span id="preview-id">-</span></span>
                                    <span class="profile-nickname">별명: <span id="preview-nickname">-</span></span>
                                    <span class="profile-level">레벨: <span id="preview-level">1</span></span>
                                    <span class="profile-title">칭호: <span id="preview-title">초보자</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button class="btn btn-primary" id="save-profile">프로필 생성</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 실시간 미리보기
        const idInput = modal.querySelector('#user-id');
        const nicknameInput = modal.querySelector('#user-nickname');
        const previewId = modal.querySelector('#preview-id');
        const previewNickname = modal.querySelector('#preview-nickname');
        
        idInput.addEventListener('input', () => {
            previewId.textContent = idInput.value || '-';
        });
        
        nicknameInput.addEventListener('input', () => {
            previewNickname.textContent = nicknameInput.value || '-';
        });
        
        // 프로필 저장
        modal.querySelector('#save-profile').addEventListener('click', () => {
            const id = idInput.value.trim();
            const nickname = nicknameInput.value.trim();
            
            if (!id || !nickname) {
                this.showToast('ID와 별명을 모두 입력해주세요.');
                return;
            }
            
            if (!/^[a-zA-Z0-9]+$/.test(id)) {
                this.showToast('ID는 영문과 숫자만 사용할 수 있습니다.');
                return;
            }
            
            this.userProfile.id = id;
            this.userProfile.nickname = nickname;
            this.saveUserProfile();
            this.updateProfileDisplay();
            
            modal.remove();
            this.showToast('프로필이 생성되었습니다!');
        });
        
        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * 프로필 모달 표시
     */
    showProfileModal() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        
        const currentLevelInfo = this.getCurrentLevelInfo();
        const nextLevelInfo = this.getNextLevelInfo();
        const progressPercent = this.getLevelProgress();
        
        modal.innerHTML = `
            <div class="modal-content profile-modal-content">
                <div class="modal-header">
                    <h2>🎮 내 프로필</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="profile-summary">
                        <div class="profile-avatar">
                            <div class="avatar-icon" style="background: ${currentLevelInfo.color}">
                                ${this.getLevelIcon(this.userProfile.level)}
                            </div>
                        </div>
                        <div class="profile-details">
                            <h3 class="profile-nickname">${this.userProfile.nickname}</h3>
                            <p class="profile-id">ID: ${this.userProfile.id}</p>
                            <p class="profile-title" style="color: ${currentLevelInfo.color}">${currentLevelInfo.title}</p>
                        </div>
                    </div>
                    
                    <div class="level-progress">
                        <div class="level-info">
                            <span class="current-level">레벨 ${this.userProfile.level}</span>
                            <span class="next-level">다음 레벨까지 ${nextLevelInfo ? nextLevelInfo.expRequired - this.userProfile.experience : 0} XP</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="exp-info">
                            <span>${this.userProfile.experience} / ${nextLevelInfo ? nextLevelInfo.expRequired : 'MAX'} XP</span>
                        </div>
                    </div>
                    
                    <div class="profile-stats">
                        <div class="stat-item">
                            <span class="stat-label">총 포인트</span>
                            <span class="stat-value">${this.userProfile.totalPoints.toLocaleString()}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">트로피</span>
                            <span class="stat-value">${this.userProfile.totalTrophies}개</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">완료한 게임</span>
                            <span class="stat-value">${this.userProfile.gamesCompleted}회</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">연속 플레이</span>
                            <span class="stat-value">${this.userProfile.consecutiveDays}일</span>
                        </div>
                    </div>
                    
                    <div class="level-rewards">
                        <h4>다음 레벨 보상</h4>
                        ${nextLevelInfo ? `
                            <div class="reward-item">
                                <span class="reward-icon">🎁</span>
                                <span class="reward-text">${nextLevelInfo.expRequired - this.userProfile.experience} XP 더 필요</span>
                            </div>
                        ` : `
                            <div class="reward-item">
                                <span class="reward-icon">🏆</span>
                                <span class="reward-text">최고 레벨 달성!</span>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * 게임 완료 시 경험치 추가
     */
    addGameCompleteExp(difficulty, gameStats = {}) {
        const baseExp = this.expRewards.gameComplete[difficulty] || 10;
        let totalExp = baseExp;
        
        // 연속 플레이 보너스
        if (this.userProfile.consecutiveDays > 0) {
            totalExp += this.expRewards.consecutiveBonus;
        }
        
        // 일일 보너스
        const today = new Date().toDateString();
        if (this.userProfile.lastPlayDate !== today) {
            totalExp += this.expRewards.dailyBonus;
            this.userProfile.consecutiveDays++;
        }
        
        this.addExperience(totalExp);
        this.userProfile.gamesCompleted++;
        this.userProfile.lastPlayDate = today;
        
        // 포인트 업데이트
        if (window.achievementSystem) {
            this.userProfile.totalPoints = window.achievementSystem.getTotalPoints();
        }
        
        // 트로피 업데이트
        const trophies = JSON.parse(localStorage.getItem('sudoku_trophies') || '[]');
        this.userProfile.totalTrophies = trophies.length;
        
        this.saveUserProfile();
        
        console.log(`게임 완료 경험치 획득: +${totalExp} XP (기본: ${baseExp}, 보너스: ${totalExp - baseExp})`);
    }

    /**
     * 업적 달성 시 경험치 추가
     */
    addAchievementExp() {
        this.addExperience(this.expRewards.achievement);
        console.log(`업적 달성 경험치 획득: +${this.expRewards.achievement} XP`);
    }

    /**
     * 트로피 획득 시 경험치 추가
     */
    addTrophyExp() {
        this.addExperience(this.expRewards.trophy);
        console.log(`트로피 획득 경험치 획득: +${this.expRewards.trophy} XP`);
    }

    /**
     * 경험치 추가
     */
    addExperience(amount) {
        this.userProfile.experience += amount;
        
        // 레벨업 체크
        const oldLevel = this.userProfile.level;
        this.checkLevelUp();
        
        if (this.userProfile.level > oldLevel) {
            this.showLevelUpModal(oldLevel, this.userProfile.level);
        }
        
        this.updateProfileDisplay();
    }

    /**
     * 레벨업 체크
     */
    checkLevelUp() {
        const nextLevel = this.levelRequirements.find(req => 
            req.level === this.userProfile.level + 1 && 
            this.userProfile.experience >= req.expRequired
        );
        
        if (nextLevel) {
            this.userProfile.level = nextLevel.level;
            this.userProfile.title = nextLevel.title;
            return true;
        }
        
        return false;
    }

    /**
     * 레벨업 모달 표시
     */
    showLevelUpModal(oldLevel, newLevel) {
        const newLevelInfo = this.getCurrentLevelInfo();
        const reward = this.levelRewards[newLevel];
        
        const modal = document.createElement('div');
        modal.className = 'modal show level-up-modal';
        modal.innerHTML = `
            <div class="modal-content level-up-content">
                <div class="level-up-animation">
                    <div class="level-up-icon">🎉</div>
                    <h2>레벨업!</h2>
                    <div class="level-change">
                        <span class="old-level">Lv.${oldLevel}</span>
                        <span class="arrow">→</span>
                        <span class="new-level" style="color: ${newLevelInfo.color}">Lv.${newLevel}</span>
                    </div>
                    <div class="new-title" style="color: ${newLevelInfo.color}">${newLevelInfo.title}</div>
                </div>
                
                ${reward ? `
                    <div class="level-rewards">
                        <h3>레벨업 보상</h3>
                        <div class="reward-list">
                            ${reward.points ? `
                                <div class="reward-item">
                                    <span class="reward-icon">💰</span>
                                    <span class="reward-text">+${reward.points} 포인트</span>
                                </div>
                            ` : ''}
                            ${reward.theme ? `
                                <div class="reward-item">
                                    <span class="reward-icon">🎨</span>
                                    <span class="reward-text">새 테마 해금!</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <div class="modal-buttons">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">확인</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 보상 적용
        if (reward) {
            if (reward.points && window.achievementSystem) {
                window.achievementSystem.addPoints(reward.points);
            }
            if (reward.theme && window.shopSystem) {
                window.shopSystem.addPurchasedItem(reward.theme);
            }
        }
        
        // 사운드 효과
        if (window.audioManager) {
            window.audioManager.playSound('levelup');
        }
        
        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * 현재 레벨 정보 가져오기
     */
    getCurrentLevelInfo() {
        return this.levelRequirements.find(req => req.level === this.userProfile.level) || 
               this.levelRequirements[0];
    }

    /**
     * 다음 레벨 정보 가져오기
     */
    getNextLevelInfo() {
        return this.levelRequirements.find(req => req.level === this.userProfile.level + 1);
    }

    /**
     * 레벨 진행률 계산
     */
    getLevelProgress() {
        const currentLevelInfo = this.getCurrentLevelInfo();
        const nextLevelInfo = this.getNextLevelInfo();
        
        if (!nextLevelInfo) return 100;
        
        const currentExp = this.userProfile.experience - currentLevelInfo.expRequired;
        const requiredExp = nextLevelInfo.expRequired - currentLevelInfo.expRequired;
        
        return Math.min(100, (currentExp / requiredExp) * 100);
    }

    /**
     * 레벨별 아이콘 가져오기
     */
    getLevelIcon(level) {
        const icons = ['🌱', '📚', '⚔️', '🎯', '👑', '🏆', '💎', '🌟', '🔮', '👑'];
        return icons[Math.min(level - 1, icons.length - 1)];
    }

    /**
     * 프로필 표시 업데이트
     */
    updateProfileDisplay() {
        // 헤더에 프로필 정보 표시
        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            const currentLevelInfo = this.getCurrentLevelInfo();
            profileBtn.innerHTML = `
                <span class="profile-level">Lv.${this.userProfile.level}</span>
                <span class="profile-nickname">${this.userProfile.nickname}</span>
            `;
        }
    }

    /**
     * 닉네임 변경 모달 표시
     */
    showNicknameChangeModal() {
        console.log('닉네임 변경 모달 표시 시작');
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>✏️ 닉네임 변경</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="nickname-change">
                        <div class="current-nickname">
                            <label>현재 닉네임:</label>
                            <div class="current-nickname-display">${this.userProfile.nickname}</div>
                        </div>
                        <div class="input-group">
                            <label for="new-nickname">새 닉네임:</label>
                            <input type="text" id="new-nickname" placeholder="새로운 닉네임을 입력하세요" maxlength="15" value="${this.userProfile.nickname}">
                        </div>
                        <div class="nickname-preview">
                            <h4>미리보기</h4>
                            <div class="profile-card">
                                <div class="profile-info">
                                    <span class="profile-id">ID: ${this.userProfile.id}</span>
                                    <span class="profile-nickname">별명: <span id="preview-new-nickname">${this.userProfile.nickname}</span></span>
                                    <span class="profile-level">레벨: ${this.userProfile.level}</span>
                                    <span class="profile-title">칭호: ${this.userProfile.title}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button class="btn btn-primary" id="save-nickname">닉네임 변경</button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">취소</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        console.log('닉네임 변경 모달이 DOM에 추가됨');
        
        // 실시간 미리보기
        const nicknameInput = modal.querySelector('#new-nickname');
        const previewNickname = modal.querySelector('#preview-new-nickname');
        
        nicknameInput.addEventListener('input', () => {
            previewNickname.textContent = nicknameInput.value || this.userProfile.nickname;
        });
        
        // 닉네임 저장
        modal.querySelector('#save-nickname').addEventListener('click', () => {
            const newNickname = nicknameInput.value.trim();
            
            if (!newNickname) {
                this.showToast('닉네임을 입력해주세요.');
                return;
            }
            
            if (newNickname === this.userProfile.nickname) {
                this.showToast('현재 닉네임과 동일합니다.');
                return;
            }
            
            this.userProfile.nickname = newNickname;
            this.saveUserProfile();
            this.updateProfileDisplay();
            this.updateSettingsProfileDisplay();
            
            modal.remove();
            this.showToast('닉네임이 변경되었습니다!');
        });
        
        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // 포커스 설정
        nicknameInput.focus();
        nicknameInput.select();
    }

    /**
     * 프로필 초기화 모달 표시
     */
    showProfileResetModal() {
        console.log('프로필 초기화 모달 표시 시작');
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>⚠️ 프로필 초기화</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="reset-warning">
                        <div class="warning-icon">⚠️</div>
                        <h3>정말로 프로필을 초기화하시겠습니까?</h3>
                        <p>다음 데이터가 모두 삭제됩니다:</p>
                        <ul class="reset-list">
                            <li>레벨 및 경험치</li>
                            <li>획득한 업적</li>
                            <li>수집한 트로피</li>
                            <li>게임 통계</li>
                            <li>구매한 아이템</li>
                        </ul>
                        <div class="current-profile-info">
                            <h4>현재 프로필 정보</h4>
                            <div class="profile-summary">
                                <div class="profile-avatar">
                                    <div class="avatar-icon" style="background: ${this.getCurrentLevelInfo().color}">
                                        ${this.getLevelIcon(this.userProfile.level)}
                                    </div>
                                </div>
                                <div class="profile-details">
                                    <h3>${this.userProfile.nickname}</h3>
                                    <p>ID: ${this.userProfile.id}</p>
                                    <p style="color: ${this.getCurrentLevelInfo().color}">${this.userProfile.title}</p>
                                    <p>레벨 ${this.userProfile.level} (${this.userProfile.experience} XP)</p>
                                </div>
                            </div>
                        </div>
                        <div class="reset-confirmation">
                            <label>
                                <input type="checkbox" id="confirm-reset">
                                위 내용을 확인했으며, 프로필 초기화에 동의합니다.
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button class="btn btn-danger" id="confirm-reset-btn" disabled>프로필 초기화</button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">취소</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        console.log('프로필 초기화 모달이 DOM에 추가됨');
        
        // 확인 체크박스 이벤트
        const confirmCheckbox = modal.querySelector('#confirm-reset');
        const confirmBtn = modal.querySelector('#confirm-reset-btn');
        
        confirmCheckbox.addEventListener('change', () => {
            confirmBtn.disabled = !confirmCheckbox.checked;
        });
        
        // 프로필 초기화 실행
        confirmBtn.addEventListener('click', () => {
            if (!confirmCheckbox.checked) {
                this.showToast('확인 체크박스를 선택해주세요.');
                return;
            }
            
            this.resetProfile();
            modal.remove();
            this.showToast('프로필이 초기화되었습니다.');
        });
        
        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * 프로필 초기화 실행
     */
    resetProfile() {
        // 기본 프로필로 초기화
        this.userProfile = {
            id: this.userProfile.id, // ID는 유지
            nickname: this.userProfile.nickname, // 닉네임은 유지
            level: 1,
            experience: 0,
            totalPoints: 0,
            totalTrophies: 0,
            gamesCompleted: 0,
            consecutiveDays: 0,
            lastPlayDate: null,
            title: '초보자',
            joinDate: new Date().toISOString()
        };
        
        // 프로필 저장
        this.saveUserProfile();
        
        // 관련 데이터 초기화
        localStorage.removeItem('sudoku_achievements');
        localStorage.removeItem('sudoku_trophies');
        localStorage.removeItem('sudoku_user_analytics');
        localStorage.removeItem('sudoku_purchased_items');
        localStorage.removeItem('sudoku_points');
        localStorage.removeItem('sudoku_unlocked_board_sizes');
        localStorage.removeItem('sudoku_unlocked_difficulties');
        
        // UI 업데이트
        this.updateProfileDisplay();
        this.updateSettingsProfileDisplay();
        
        // 다른 시스템들도 초기화 알림
        if (window.achievementSystem) {
            window.achievementSystem.unlockedAchievements = [];
            window.achievementSystem.saveAchievements();
        }
        
        if (window.shopSystem) {
            window.shopSystem.purchasedItems = [];
            window.shopSystem.points = 0;
            window.shopSystem.savePurchasedItems();
            // savePoints 메서드는 존재하지 않으므로 제거
        }
        
        // 게임 시스템 초기화
        if (window.sudokuGame) {
            window.sudokuGame.unlockedBoardSizes = [6]; // 6x6만 잠금 해제
            window.sudokuGame.unlockedDifficulties = { '6-easy': true }; // 6x6 쉬움만 잠금 해제
            window.sudokuGame.saveUnlockedBoardSizes();
            window.sudokuGame.saveUnlockedDifficulties();
            window.sudokuGame.updateBoardSizeButtons();
            window.sudokuGame.updateDifficultyButtons();
        }
        
        console.log('프로필이 초기화되었습니다.');
    }

    /**
     * 설정 화면 프로필 정보 업데이트
     */
    updateSettingsProfileDisplay() {
        const avatarElement = document.getElementById('settings-profile-avatar');
        const nicknameElement = document.getElementById('settings-profile-nickname');
        const levelElement = document.getElementById('settings-profile-level');
        
        if (avatarElement) {
            avatarElement.textContent = this.getLevelIcon(this.userProfile.level);
            avatarElement.style.background = this.getCurrentLevelInfo().color;
        }
        
        if (nicknameElement) {
            nicknameElement.textContent = this.userProfile.nickname;
        }
        
        if (levelElement) {
            levelElement.textContent = `Lv.${this.userProfile.level} ${this.userProfile.title}`;
        }
    }

    /**
     * 토스트 메시지 표시
     */
    showToast(message) {
        if (window.uiManager) {
            window.uiManager.showToast(message);
        } else {
            console.log('Toast:', message);
        }
    }
}

// 전역 인스턴스 생성
window.levelSystem = new LevelSystem();
