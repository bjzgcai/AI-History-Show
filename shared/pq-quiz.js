(function (global) {
    const DEFAULT_QR_IMAGE = 'resources/pq.png';
    const IDLE_TRIGGER_MS = 10000;
    const POPUP_IDLE_DISMISS_MS = 15000;
    const VIDEO_RESUME_DELAY_MS = 1200;
    const ACTIVITY_EVENTS = ['pointerdown', 'wheel', 'keydown', 'touchstart'];

    const state = {
        timer: 0,
        visibleTimer: 0,
        resumeTimer: 0,
        milestoneKey: '',
        visible: false,
        dismissed: false,
        pendingBecauseVideo: false,
        selectedDifficulty: 'easy',
        selectedQuestionIndex: 0,
        answered: false,
        selectedOptionIndex: -1,
        config: null,
        overlay: null,
        styleInjected: false,
        outsideClickBound: false,
        activityBound: false
    };

    function localize(value) {
        if (global.I18n && typeof global.I18n.localize === 'function') {
            return global.I18n.localize(value);
        }
        if (!value || typeof value !== 'object' || Array.isArray(value)) return value == null ? '' : String(value);
        return value.zh || value.en || '';
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeMilestoneKey(value) {
        return String(value || '').replace(/^milestone-/, '');
    }

    function getData() {
        const data = global.pqQuizData;
        return data && Array.isArray(data.groups) ? data : null;
    }

    function getGroupsForMilestone(milestoneKey) {
        const data = getData();
        if (!data) return [];
        const key = normalizeMilestoneKey(milestoneKey);
        return data.groups.filter((group) => group && group.milestoneKey === key);
    }

    function getGroup(difficulty) {
        const groups = getGroupsForMilestone(state.milestoneKey);
        return groups.find((group) => group.difficulty === difficulty) || groups[0] || null;
    }

    function getQuestion() {
        const group = getGroup(state.selectedDifficulty);
        if (!group || !Array.isArray(group.questions) || !group.questions.length) return null;
        return group.questions[state.selectedQuestionIndex % group.questions.length];
    }

    function injectStyles() {
        if (state.styleInjected || !global.document) return;
        const style = document.createElement('style');
        style.id = 'pqQuizStyles';
        style.textContent = `
            .pq-quiz-overlay {
                position: fixed;
                right: max(18px, 2.1vw);
                bottom: max(18px, 2.4vh);
                z-index: 2500;
                width: min(620px, 34vw);
                min-width: 430px;
                color: #f4efe5;
                font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
                pointer-events: auto;
                transform: translateY(18px);
                opacity: 0;
                transition: opacity 220ms ease, transform 220ms ease;
            }

            .pq-quiz-overlay.is-visible {
                transform: translateY(0);
                opacity: 1;
            }

            .pq-quiz-panel {
                position: relative;
                display: grid;
                grid-template-columns: minmax(0, 1fr);
                gap: 16px;
                padding: 22px;
                border: 1px solid rgba(244, 239, 229, 0.22);
                background:
                    linear-gradient(135deg, rgba(246, 137, 0, 0.018), transparent 26%),
                    rgba(3, 3, 3, 0.11);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.13);
                backdrop-filter: blur(5px) saturate(1.03);
                text-shadow: 0 1px 14px rgba(0, 0, 0, 0.82), 0 0 2px rgba(0, 0, 0, 0.95);
                overflow: hidden;
            }

            .pq-quiz-panel:not(.is-answered) {
                padding-bottom: 46px;
            }

            .pq-quiz-panel::before {
                content: "";
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                background: linear-gradient(180deg, #f68900, rgba(246, 137, 0, 0.18));
            }

            .pq-quiz-panel.is-answered {
                grid-template-columns: minmax(0, 1fr) 138px;
                align-items: start;
            }

            .pq-quiz-panel.is-correct::before {
                background: linear-gradient(180deg, #57d68d, rgba(87, 214, 141, 0.16));
            }

            .pq-quiz-panel.is-wrong::before {
                background: linear-gradient(180deg, #d98245, rgba(217, 130, 69, 0.16));
            }

            .pq-quiz-main {
                position: relative;
                min-width: 0;
            }

            .pq-quiz-panel.is-answered .pq-quiz-main {
                grid-column: 1;
                grid-row: 1;
            }

            .pq-quiz-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding-right: 34px;
                margin-bottom: 8px;
            }

            .pq-quiz-kicker {
                color: #f68900;
                font-size: 13px;
                font-weight: 800;
                letter-spacing: 0.08em;
                text-transform: uppercase;
            }

            .pq-quiz-difficulty {
                flex: 0 0 auto;
                display: inline-flex;
                align-items: center;
                border: 1px solid rgba(246, 137, 0, 0.58);
                background: rgba(0, 0, 0, 0.42);
            }

            .pq-quiz-difficulty-option {
                min-height: 34px;
                padding: 0 12px;
                border: 0;
                border-right: 1px solid rgba(246, 137, 0, 0.32);
                background: transparent;
                color: rgba(244, 239, 229, 0.46);
                font-size: 12px;
                font-weight: 800;
                line-height: 1;
                cursor: pointer;
            }

            .pq-quiz-difficulty-option:last-child {
                border-right: 0;
            }

            .pq-quiz-difficulty-option.is-active {
                background: #f68900;
                color: #120901;
                box-shadow: inset 0 0 0 1px rgba(255, 227, 188, 0.36);
            }

            .pq-quiz-difficulty-option:hover,
            .pq-quiz-difficulty-option:focus-visible {
                color: #f4efe5;
                outline: none;
            }

            .pq-quiz-title {
                color: rgba(244, 239, 229, 0.84);
                font-size: 15px;
                line-height: 1.35;
                margin-bottom: 10px;
            }

            .pq-quiz-question {
                color: #f4efe5;
                font-size: 24px;
                line-height: 1.25;
                font-weight: 800;
                margin-bottom: 16px;
            }

            .pq-quiz-options {
                display: grid;
                gap: 8px;
            }

            .pq-quiz-option {
                display: grid;
                grid-template-columns: 28px minmax(0, 1fr);
                align-items: center;
                gap: 8px;
                width: 100%;
                min-height: 42px;
                padding: 8px 10px;
                border: 1px solid rgba(244, 239, 229, 0.28);
                background: rgba(255, 255, 255, 0.006);
                color: rgba(244, 239, 229, 0.94);
                text-align: left;
                cursor: pointer;
                transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
            }

            .pq-quiz-option:hover,
            .pq-quiz-option:focus-visible {
                border-color: rgba(255, 190, 112, 0.86);
                background: rgba(246, 137, 0, 0.08);
                transform: translateX(3px);
                outline: none;
            }

            .pq-quiz-option.is-correct {
                border-color: #57d68d;
                background: rgba(45, 151, 91, 0.18);
                color: #dfffe9;
                box-shadow: inset 4px 0 0 #57d68d;
            }

            .pq-quiz-option.is-wrong {
                border-color: rgba(244, 239, 229, 0.2);
                background: rgba(255, 255, 255, 0.045);
                color: rgba(244, 239, 229, 0.58);
                box-shadow: none;
            }

            .pq-quiz-option.is-wrong .pq-quiz-option-letter,
            .pq-quiz-option.is-wrong .pq-quiz-option-text {
                color: rgba(244, 184, 124, 0.72);
            }

            .pq-quiz-option:disabled {
                cursor: default;
            }

            .pq-quiz-option:disabled:hover {
                transform: none;
            }

            .pq-quiz-option-letter {
                display: inline-grid;
                place-items: center;
                width: 28px;
                height: 28px;
                border: 1px solid rgba(244, 239, 229, 0.22);
                color: rgba(244, 239, 229, 0.68);
                font-weight: 900;
            }

            .pq-quiz-option-text {
                min-width: 0;
                font-size: 16px;
                line-height: 1.25;
            }

            .pq-quiz-feedback {
                display: none;
                grid-column: 1 / -1;
                grid-row: 2;
                margin-top: 14px;
                padding: 16px 17px;
                border: 1px solid rgba(244, 239, 229, 0.28);
                background: rgba(10, 10, 10, 0.42);
                color: rgba(244, 239, 229, 0.88);
                font-size: 15px;
                line-height: 1.42;
            }

            .pq-quiz-feedback.is-visible {
                display: block;
            }

            .pq-quiz-feedback.is-correct {
                border-color: rgba(87, 214, 141, 0.38);
                background: rgba(24, 96, 54, 0.18);
            }

            .pq-quiz-feedback.is-wrong {
                border-color: rgba(217, 130, 69, 0.34);
                background: rgba(96, 48, 28, 0.2);
            }

            .pq-quiz-result {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 9px;
                color: #f4efe5;
                font-size: 20px;
                font-weight: 900;
                line-height: 1.1;
            }

            .pq-quiz-result-mark {
                display: inline-grid;
                place-items: center;
                width: 32px;
                height: 32px;
                color: #050505;
                background: #57d68d;
                font-size: 20px;
                font-weight: 900;
            }

            .pq-quiz-feedback.is-wrong .pq-quiz-result-mark {
                background: #f68900;
            }

            .pq-quiz-correct-answer {
                margin-bottom: 8px;
                color: #bdfbd0;
                font-weight: 800;
            }

            .pq-quiz-explanation {
                color: rgba(244, 239, 229, 0.82);
            }

            .pq-quiz-actions {
                display: none;
                position: absolute;
                right: 14px;
                bottom: 12px;
                margin: 0;
            }

            .pq-quiz-actions.is-visible {
                display: flex;
            }

            .pq-quiz-action {
                min-height: 28px;
                padding: 0 10px;
                border: 1px solid rgba(246, 137, 0, 0.82);
                background: rgba(246, 137, 0, 0.2);
                color: #ffd8a8;
                font-size: 12px;
                font-weight: 800;
                cursor: pointer;
            }

            .pq-quiz-action:hover,
            .pq-quiz-action:focus-visible {
                border-color: #f68900;
                background: #f68900;
                color: #120901;
                outline: none;
            }

            .pq-quiz-action.is-primary {
                border-color: rgba(246, 137, 0, 0.72);
                background: rgba(246, 137, 0, 0.14);
                color: #ffd8a8;
            }

            .pq-quiz-close {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 30px;
                height: 30px;
                border: 0;
                background: transparent;
                color: rgba(244, 239, 229, 0.5);
                font-size: 24px;
                line-height: 1;
                cursor: pointer;
            }

            .pq-quiz-close:hover,
            .pq-quiz-close:focus-visible {
                color: #f4efe5;
                outline: none;
            }

            .pq-quiz-qr {
                display: none;
                grid-template-columns: minmax(0, 1fr);
                align-items: start;
                justify-items: center;
                gap: 8px;
                min-width: 0;
                padding-top: 28px;
                text-align: center;
            }

            .pq-quiz-qr.is-visible {
                display: grid;
            }

            .pq-quiz-qr-box {
                display: grid;
                place-items: center;
                width: 118px;
                height: 118px;
                margin: 0 auto;
                background: #fff;
                color: #111;
                overflow: hidden;
                box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24);
            }

            .pq-quiz-qr-box img {
                display: block;
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .pq-quiz-qr-placeholder {
                display: none;
                padding: 10px;
                font-size: 12px;
                line-height: 1.25;
                font-weight: 800;
            }

            .pq-quiz-qr-box.is-missing img {
                display: none;
            }

            .pq-quiz-qr-box.is-missing .pq-quiz-qr-placeholder {
                display: block;
            }

            .pq-quiz-qr-title {
                display: none;
                color: #f4efe5;
                font-size: 14px;
                font-weight: 800;
                line-height: 1.25;
                margin-bottom: 5px;
            }

            .pq-quiz-qr-copy {
                color: rgba(244, 239, 229, 0.78);
                font-size: 12px;
                line-height: 1.35;
            }

            .pq-quiz-panel.is-answered .pq-quiz-qr {
                grid-column: 2;
                grid-row: 1;
                align-self: start;
            }

            .pq-quiz-panel.is-answered .pq-quiz-qr-copy {
                text-align: center;
            }

            @media (min-width: 3000px) {
                .pq-quiz-overlay {
                    right: max(34px, 1.4vw);
                    bottom: max(30px, 3vh);
                    width: 610px;
                }
            }

            @media (max-width: 1100px) {
                .pq-quiz-overlay {
                    left: 14px;
                    right: 14px;
                    bottom: 14px;
                    width: auto;
                    min-width: 0;
                }

                .pq-quiz-panel {
                    grid-template-columns: minmax(0, 1fr);
                    gap: 12px;
                    padding: 18px;
                }

                .pq-quiz-panel.is-answered {
                    grid-template-columns: minmax(0, 1fr);
                }

                .pq-quiz-panel.is-answered .pq-quiz-main,
                .pq-quiz-panel.is-answered .pq-quiz-qr,
                .pq-quiz-feedback,
                .pq-quiz-actions {
                    grid-column: 1;
                    grid-row: auto;
                }

                .pq-quiz-question {
                    font-size: 20px;
                }

                .pq-quiz-qr {
                    display: grid;
                    grid-template-columns: 108px minmax(0, 1fr);
                    align-items: center;
                    gap: 12px;
                    justify-items: start;
                    padding-top: 0;
                    text-align: left;
                }

                .pq-quiz-qr:not(.is-visible) {
                    display: none;
                }

                .pq-quiz-qr-box {
                    width: 108px;
                    height: 108px;
                    margin: 0;
                }
            }
        `;
        document.head.appendChild(style);
        state.styleInjected = true;
    }

    function ensureOverlay() {
        if (state.overlay && document.body.contains(state.overlay)) return state.overlay;
        injectStyles();
        const overlay = document.createElement('aside');
        overlay.className = 'pq-quiz-overlay';
        overlay.setAttribute('aria-live', 'polite');
        document.body.appendChild(overlay);
        state.overlay = overlay;
        return overlay;
    }

    function getTitle() {
        if (state.config && typeof state.config.getMilestoneTitle === 'function') {
            return state.config.getMilestoneTitle() || '';
        }
        return '';
    }

    function getQrImage() {
        const data = getData();
        return (data && data.meta && data.meta.qrImage) || DEFAULT_QR_IMAGE;
    }

    function render() {
        const overlay = ensureOverlay();
        const groups = getGroupsForMilestone(state.milestoneKey);
        const questionData = getQuestion();
        if (!groups.length || !questionData) {
            hide({ keepDismissed: true });
            return;
        }

        const hasEasy = groups.some((groupItem) => groupItem.difficulty === 'easy');
        const hasChallenge = groups.some((groupItem) => groupItem.difficulty === 'challenge');
        const feedbackVisible = state.answered;
        const correctIndex = questionData.correctOptionIndex;
        const selectedIndex = state.selectedOptionIndex;
        const answerPrefix =
            selectedIndex === correctIndex
                ? localize(text('答对了。', 'Correct.'))
                : localize(text('差一点。', 'Close.'));
        const isCorrect = selectedIndex === correctIndex;
        const correctLabel = questionData.options[correctIndex] ? localize(questionData.options[correctIndex]) : '';
        const qrImage = getQrImage();

        overlay.innerHTML = `
            <div class="pq-quiz-panel ${feedbackVisible ? 'is-answered' : ''} ${feedbackVisible && isCorrect ? 'is-correct' : ''} ${feedbackVisible && !isCorrect ? 'is-wrong' : ''}" role="dialog" aria-label="${escapeHtml(localize(text('AI 历史趣味测试', 'AI history pop quiz')))}">
                <button class="pq-quiz-close" type="button" data-pq-action="dismiss" aria-label="${escapeHtml(localize(text('跳过', 'Skip')))}">×</button>
                <div class="pq-quiz-main">
                    <div class="pq-quiz-header">
                        <div class="pq-quiz-kicker">POP QUIZ</div>
                        <div class="pq-quiz-difficulty" aria-label="${escapeHtml(localize(text('题目难度', 'Question difficulty')))}">
                            ${hasEasy ? `<button class="pq-quiz-difficulty-option ${state.selectedDifficulty === 'easy' ? 'is-active' : ''}" type="button" data-pq-difficulty="easy">${escapeHtml(localize(text('基础', 'Basic')))}</button>` : ''}
                            ${hasChallenge ? `<button class="pq-quiz-difficulty-option ${state.selectedDifficulty === 'challenge' ? 'is-active' : ''}" type="button" data-pq-difficulty="challenge">${escapeHtml(localize(text('挑战', 'Challenge')))}</button>` : ''}
                        </div>
                    </div>
                    <div class="pq-quiz-title">${escapeHtml(getTitle() || localize(text('刚刚这个 AI 里程碑，你答得出来吗？', 'Can you answer this AI milestone question?')))}</div>
                    <div class="pq-quiz-question">${escapeHtml(localize(questionData.question))}</div>
                    <div class="pq-quiz-options">
                        ${questionData.options
                            .map((item, index) => {
                                const statusClass = !state.answered
                                    ? ''
                                    : index === correctIndex
                                      ? ' is-correct'
                                      : index === selectedIndex
                                        ? ' is-wrong'
                                        : '';
                                return `
                                <button class="pq-quiz-option${statusClass}" type="button" data-pq-option="${index}" ${state.answered ? 'disabled' : ''}>
                                    <span class="pq-quiz-option-letter">${String.fromCharCode(65 + index)}</span>
                                    <span class="pq-quiz-option-text">${escapeHtml(localize(item))}</span>
                                </button>
                            `;
                            })
                            .join('')}
                    </div>
                </div>
                <div class="pq-quiz-qr ${feedbackVisible ? 'is-visible' : ''}">
                    <div class="pq-quiz-qr-box">
                        <img src="${escapeHtml(qrImage)}" alt="${escapeHtml(localize(text('Pop Quiz AI 通识课二维码', 'Pop Quiz AI literacy QR code')))}">
                        <div class="pq-quiz-qr-placeholder">POP QUIZ<br>QR</div>
                    </div>
                    <div>
                        <div class="pq-quiz-qr-copy">${escapeHtml(localize(text('扫码完成完整挑战，凭结果页领取纪念品', 'Scan to complete the full challenge and redeem a souvenir with your result page')))}</div>
                    </div>
                </div>
                <div class="pq-quiz-feedback ${feedbackVisible ? 'is-visible' : ''} ${isCorrect ? 'is-correct' : 'is-wrong'}">
                    <div class="pq-quiz-result">
                        <span class="pq-quiz-result-mark">${escapeHtml(isCorrect ? '✓' : '!')}</span>
                        <span>${escapeHtml(answerPrefix)}</span>
                    </div>
                    ${isCorrect ? '' : `<div class="pq-quiz-correct-answer">${escapeHtml(localize(text('正确答案是：', 'Correct answer: ')))}${escapeHtml(correctLabel)}</div>`}
                    <div class="pq-quiz-explanation">${escapeHtml(localize(questionData.explanation))}</div>
                </div>
                <div class="pq-quiz-actions ${state.answered ? '' : 'is-visible'}">
                    <button class="pq-quiz-action" type="button" data-pq-action="dismiss">${escapeHtml(localize(text('跳过', 'Skip')))}</button>
                </div>
            </div>
        `;

        overlay.querySelectorAll('[data-pq-option]').forEach((button) => {
            button.addEventListener('click', () => {
                state.answered = true;
                state.selectedOptionIndex = Number(button.dataset.pqOption);
                render();
                restartVisibleTimer();
            });
        });

        overlay.querySelectorAll('[data-pq-action]').forEach((button) => {
            button.addEventListener('click', () => {
                const action = button.dataset.pqAction;
                if (action === 'dismiss') {
                    dismiss();
                    return;
                }
            });
        });

        overlay.querySelectorAll('[data-pq-difficulty]').forEach((button) => {
            button.addEventListener('click', () => {
                state.selectedDifficulty = button.dataset.pqDifficulty || 'easy';
                state.selectedQuestionIndex = 0;
                state.answered = false;
                state.selectedOptionIndex = -1;
                render();
                restartVisibleTimer();
            });
        });

        const qrBox = overlay.querySelector('.pq-quiz-qr-box');
        const qrImg = overlay.querySelector('.pq-quiz-qr-box img');
        if (qrImg && qrBox) {
            qrImg.addEventListener(
                'error',
                () => {
                    qrBox.classList.add('is-missing');
                },
                { once: true }
            );
        }

        global.requestAnimationFrame(() => {
            overlay.classList.add('is-visible');
        });
    }

    function show() {
        if (state.dismissed || state.visible) return;
        if (typeof state.config.isVideoPlaying === 'function' && state.config.isVideoPlaying()) {
            state.pendingBecauseVideo = true;
            return;
        }
        state.pendingBecauseVideo = false;
        state.visible = true;
        state.answered = false;
        state.selectedOptionIndex = -1;
        render();
        restartVisibleTimer();
    }

    function hide(options = {}) {
        state.visible = false;
        window.clearTimeout(state.visibleTimer);
        state.visibleTimer = 0;
        const overlay = state.overlay;
        if (!overlay) return;
        overlay.classList.remove('is-visible');
        if (!options.keepMounted) {
            window.setTimeout(() => {
                if (!state.visible && overlay.parentNode) {
                    overlay.remove();
                }
            }, 240);
        }
    }

    function dismiss() {
        state.dismissed = true;
        state.pendingBecauseVideo = false;
        hide();
    }

    function clearTimers() {
        window.clearTimeout(state.timer);
        window.clearTimeout(state.visibleTimer);
        window.clearTimeout(state.resumeTimer);
        state.timer = 0;
        state.visibleTimer = 0;
        state.resumeTimer = 0;
    }

    function hasScheduledQuiz() {
        return Boolean(state.milestoneKey && getGroupsForMilestone(state.milestoneKey).length);
    }

    function restartIdleTimer() {
        window.clearTimeout(state.timer);
        state.timer = 0;

        if (!hasScheduledQuiz() || state.visible || state.dismissed) return;
        state.timer = window.setTimeout(show, IDLE_TRIGGER_MS);
    }

    function restartVisibleTimer() {
        window.clearTimeout(state.visibleTimer);
        state.visibleTimer = 0;

        if (!state.visible || state.answered || state.dismissed) return;
        state.visibleTimer = window.setTimeout(() => {
            if (state.visible && !state.answered) {
                dismiss();
            }
        }, POPUP_IDLE_DISMISS_MS);
    }

    function handlePageActivity() {
        state.pendingBecauseVideo = false;
        window.clearTimeout(state.resumeTimer);
        state.resumeTimer = 0;
        if (state.visible) {
            restartVisibleTimer();
            return;
        }
        restartIdleTimer();
    }

    function schedule(milestoneKey) {
        const key = normalizeMilestoneKey(milestoneKey);
        clearTimers();
        hide();

        state.milestoneKey = key;
        state.visible = false;
        state.dismissed = false;
        state.pendingBecauseVideo = false;
        state.selectedDifficulty = 'easy';
        state.selectedQuestionIndex = 0;
        state.answered = false;
        state.selectedOptionIndex = -1;

        restartIdleTimer();
    }

    function handleVideoStarted() {
        if (state.visible) {
            state.pendingBecauseVideo = true;
            hide({ keepMounted: false });
        }
    }

    function handleVideoStopped() {
        if (!state.pendingBecauseVideo || state.dismissed || state.visible) return;
        window.clearTimeout(state.resumeTimer);
        state.resumeTimer = window.setTimeout(() => {
            if (!state.dismissed && state.pendingBecauseVideo) {
                state.pendingBecauseVideo = false;
                restartIdleTimer();
            }
        }, VIDEO_RESUME_DELAY_MS);
    }

    function bindDirectVideoEvents() {
        if (!state.config || !state.config.videoSelector || !document) return;
        document.addEventListener(
            'play',
            (event) => {
                if (event.target && event.target.matches && event.target.matches(state.config.videoSelector)) {
                    handleVideoStarted();
                }
            },
            true
        );
        document.addEventListener(
            'pause',
            (event) => {
                if (event.target && event.target.matches && event.target.matches(state.config.videoSelector)) {
                    handleVideoStopped();
                }
            },
            true
        );
        document.addEventListener(
            'ended',
            (event) => {
                if (event.target && event.target.matches && event.target.matches(state.config.videoSelector)) {
                    handleVideoStopped();
                }
            },
            true
        );
    }

    function bindOutsideClickDismiss() {
        if (state.outsideClickBound || !document) return;
        document.addEventListener(
            'pointerdown',
            (event) => {
                if (!state.visible || !state.answered) return;
                const target = event.target;
                if (target && target.closest && target.closest('.pq-quiz-panel')) return;
                dismiss();
            },
            true
        );
        state.outsideClickBound = true;
    }

    function bindPageActivity() {
        if (state.activityBound || !document) return;
        ACTIVITY_EVENTS.forEach((eventName) => {
            document.addEventListener(eventName, handlePageActivity, { capture: true, passive: true });
        });
        state.activityBound = true;
    }

    function init(config) {
        state.config = config || {};
        injectStyles();
        bindDirectVideoEvents();
        bindOutsideClickDismiss();
        bindPageActivity();
        if (global.addEventListener) {
            global.addEventListener('languageChanged', () => {
                if (state.visible) render();
            });
        }
        return api;
    }

    function text(zh, en) {
        return { zh, en };
    }

    const api = {
        init,
        schedule,
        show,
        hide,
        dismiss,
        handleVideoStarted,
        handleVideoStopped
    };

    global.PQQuiz = api;
})(typeof window !== 'undefined' ? window : globalThis);
