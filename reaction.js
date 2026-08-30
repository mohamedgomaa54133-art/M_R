/* =========================================================
   REACTION.JS
   PRIVATE CHAT — MOHAMED & RAHMA
   LONG PRESS REACTIONS
   ❤️ 🫡 🙂 🙃 🫂 🫶
   
   REACTION UI:
   داخل فقاعة الرسالة
   24px
   محمد → أسفل اليمين
   رحمة → أسفل اليسار
========================================================= */

(function () {

"use strict";

console.log("REACTION.JS STARTED");


/* =====================================================
   SETTINGS
===================================================== */

const CHAT_ID = "mohamed_rahma";

const REACTIONS = [
    "❤️",
    "🫡",
    "🙂",
    "🙃",
    "🫂",
    "🫶"
];

const LONG_PRESS_TIME = 550;


/* =====================================================
   FIRESTORE
===================================================== */

const messagesRef =
    db
        .collection("chats")
        .doc(CHAT_ID)
        .collection("messages");


/* =====================================================
   VARIABLES
===================================================== */

let selectedMessageId = null;

let pressTimer = null;

let pressStarted = false;


/* =====================================================
   CREATE REACTION BAR
===================================================== */

function createReactionBar() {

    let bar =
        document.getElementById(
            "reactionBar"
        );

    if (bar) {
        return bar;
    }

    bar =
        document.createElement("div");

    bar.id =
        "reactionBar";

    bar.className =
        "reaction-bar";

    bar.style.display =
        "none";

    REACTIONS.forEach(
        function (reaction) {

            const button =
                document.createElement("button");

            button.type =
                "button";

            button.className =
                "reaction-btn";

            button.textContent =
                reaction;

            button.dataset.reaction =
                reaction;

            button.addEventListener(
                "click",
                async function (event) {

                    event.preventDefault();

                    event.stopPropagation();

                    await sendReaction(
                        reaction
                    );

                }
            );

            bar.appendChild(
                button
            );

        }
    );

    document.body.appendChild(
        bar
    );

    return bar;
}


/* =====================================================
   SHOW REACTION BAR
===================================================== */

function showReactionBar(
    messageElement,
    messageId
) {

    const bar =
        createReactionBar();

    if (!bar || !messageElement) {
        return;
    }

    selectedMessageId =
        messageId;

    bar.style.display =
        "flex";

    bar.style.position =
        "fixed";

    const rect =
        messageElement.getBoundingClientRect();

    let top =
        rect.top - 65;

    let left =
        rect.left +
        (
            rect.width / 2
        ) -
        120;

    if (top < 10) {

        top =
            rect.bottom + 10;
    }

    if (left < 10) {

        left =
            10;
    }

    const barWidth =
        bar.offsetWidth || 240;

    if (
        left +
        barWidth >
        window.innerWidth - 10
    ) {

        left =
            window.innerWidth -
            barWidth -
            10;
    }

    bar.style.top =
        top + "px";

    bar.style.left =
        left + "px";
}


/* =====================================================
   HIDE REACTION BAR
===================================================== */

function hideReactionBar() {

    const bar =
        document.getElementById(
            "reactionBar"
        );

    if (bar) {

        bar.style.display =
            "none";
    }

    selectedMessageId =
        null;
}


/* =====================================================
   SEND / REMOVE REACTION
===================================================== */

async function sendReaction(
    reaction
) {

    if (
        !selectedMessageId ||
        !auth.currentUser
    ) {

        return;
    }

    const uid =
        auth.currentUser.uid;

    const messageId =
        selectedMessageId;

    try {

        const messageRef =
            messagesRef.doc(
                messageId
            );

        const snap =
            await messageRef.get();

        if (!snap.exists) {

            hideReactionBar();

            return;
        }

        const data =
            snap.data() || {};

        const reactions =
            data.reactions || {};


        /* ---------------------------------------------
           نفس التفاعل مرة ثانية = حذف التفاعل
        --------------------------------------------- */

        if (
            reactions[uid] ===
            reaction
        ) {

            await messageRef.update({

                [`reactions.${uid}`]:
                    firebase.firestore
                        .FieldValue
                        .delete()

            });

        } else {

            await messageRef.update({

                [`reactions.${uid}`]:
                    reaction

            });

        }

        hideReactionBar();


        /* ---------------------------------------------
           تحديث مباشر
        --------------------------------------------- */

        refreshMessageReaction(
            messageId
        );

    }

    catch (error) {

        console.error(
            "REACTION ERROR:",
            error
        );

        alert(
            "تعذر إضافة التفاعل."
        );

        hideReactionBar();
    }
}


/* =====================================================
   REFRESH MESSAGE REACTION
===================================================== */

async function refreshMessageReaction(
    messageId
) {

    try {

        const snap =
            await messagesRef
                .doc(messageId)
                .get();

        if (!snap.exists) {
            return;
        }

        const data =
            snap.data() || {};

        updateReactionUI(
            messageId,
            data.reactions || {}
        );

    }

    catch (error) {

        console.error(
            "REACTION UI ERROR:",
            error
        );

    }
}


/* =====================================================
   UPDATE REACTION UI
===================================================== */

function updateReactionUI(
    messageId,
    reactions
) {

    const wrapper =
        document.querySelector(
            `.message-wrapper[data-message-id="${messageId}"]`
        );

    if (!wrapper) {
        return;
    }


    const bubble =
        wrapper.querySelector(
            ".message-bubble"
        );

    if (!bubble) {
        return;
    }


    let reactionContainer =
        bubble.querySelector(
            ".message-reactions"
        );


    /* =================================================
       جمع التفاعلات
    ================================================= */

    const entries =
        Object.entries(
            reactions || {}
        );


    /* =================================================
       لا يوجد تفاعل
    ================================================= */

    if (!entries.length) {

        if (reactionContainer) {

            reactionContainer.remove();
        }

        return;
    }


    /* =================================================
       حساب العدد
    ================================================= */

    const counts = {};

    entries.forEach(
        function (entry) {

            const reaction =
                entry[1];

            if (!reaction) {
                return;
            }

            counts[reaction] =
                (
                    counts[reaction] ||
                    0
                ) + 1;

        }
    );


    /* =================================================
       إنشاء الحاوية داخل الفقاعة
    ================================================= */

    if (!reactionContainer) {

        reactionContainer =
            document.createElement(
                "div"
            );

        reactionContainer.className =
            "message-reactions";

        /*
           مهم:
           الحاوية داخل bubble
        */

        bubble.appendChild(
            reactionContainer
        );
    }


    reactionContainer.innerHTML =
        "";


    /* =================================================
       عرض كل تفاعل
    ================================================= */

    Object.keys(counts)
        .forEach(
            function (reaction) {

                const item =
                    document.createElement(
                        "button"
                    );

                item.type =
                    "button";

                item.className =
                    "message-reaction";

                /*
                   التفاعل نفسه
                */

                item.textContent =
                    reaction;

                /*
                   العدد يظهر فقط لو أكثر من 1
                */

                if (
                    counts[reaction] > 1
                ) {

                    item.textContent =
                        reaction +
                        counts[reaction];

                }

                item.dataset.reaction =
                    reaction;


                /* -------------------------------------
                   الضغط على دائرة التفاعل
                   يزيل / يغير التفاعل
                ------------------------------------- */

                item.addEventListener(
                    "click",
                    async function (event) {

                        event.preventDefault();

                        event.stopPropagation();

                        selectedMessageId =
                            messageId;

                        await sendReaction(
                            reaction
                        );

                    }
                );


                reactionContainer.appendChild(
                    item
                );

            }
        );
}


/* =====================================================
   RENDER REACTIONS FOR ALL MESSAGES
===================================================== */

function renderAllReactions() {

    const wrappers =
        document.querySelectorAll(
            ".message-wrapper"
        );

    wrappers.forEach(
        async function (wrapper) {

            const messageId =
                wrapper.dataset.messageId;

            if (!messageId) {
                return;
            }

            try {

                const snap =
                    await messagesRef
                        .doc(messageId)
                        .get();

                if (!snap.exists) {
                    return;
                }

                const data =
                    snap.data() || {};

                updateReactionUI(
                    messageId,
                    data.reactions || {}
                );

            }

            catch (error) {

                console.error(
                    "REACTION LOAD ERROR:",
                    error
                );

            }

        }
    );
}


/* =====================================================
   LONG PRESS START
===================================================== */

function startLongPress(
    event
) {

    if (
        event.target.closest(
            "#reactionBar"
        )
    ) {

        return;
    }


    /*
       تجاهل الضغط على دائرة التفاعل
    */

    if (
        event.target.closest(
            ".message-reaction"
        )
    ) {

        return;
    }


    const bubble =
        event.target.closest(
            ".message-bubble"
        );

    if (!bubble) {
        return;
    }


    const wrapper =
        bubble.closest(
            ".message-wrapper"
        );

    if (!wrapper) {
        return;
    }


    const messageId =
        wrapper.dataset.messageId;

    if (!messageId) {
        return;
    }


    pressStarted =
        true;


    cancelLongPress();


    pressTimer =
        setTimeout(
            function () {

                if (!pressStarted) {
                    return;
                }

                showReactionBar(
                    bubble,
                    messageId
                );

                pressTimer =
                    null;

            },
            LONG_PRESS_TIME
        );
}


/* =====================================================
   CANCEL LONG PRESS
===================================================== */

function cancelLongPress() {

    if (pressTimer) {

        clearTimeout(
            pressTimer
        );

        pressTimer =
            null;
    }
}


function endLongPress() {

    pressStarted =
        false;

    cancelLongPress();
}


/* =====================================================
   TOUCH EVENTS
===================================================== */

document.addEventListener(
    "touchstart",
    startLongPress,
    {
        passive: true
    }
);

document.addEventListener(
    "touchend",
    endLongPress
);

document.addEventListener(
    "touchcancel",
    endLongPress
);

document.addEventListener(
    "touchmove",
    endLongPress,
    {
        passive: true
    }
);


/* =====================================================
   MOUSE EVENTS
===================================================== */

document.addEventListener(
    "mousedown",
    startLongPress
);

document.addEventListener(
    "mouseup",
    endLongPress
);


/* =====================================================
   CLOSE OUTSIDE
===================================================== */

document.addEventListener(
    "click",
    function (event) {

        const bar =
            document.getElementById(
                "reactionBar"
            );

        if (!bar) {
            return;
        }

        if (
            bar.style.display ===
            "none"
        ) {

            return;
        }

        if (
            !bar.contains(
                event.target
            )
        ) {

            hideReactionBar();
        }

    }
);


/* =====================================================
   ESC
===================================================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            hideReactionBar();
        }

    }
);


/* =====================================================
   WHEN CHAT RENDERS NEW MESSAGES
===================================================== */

const messagesArea =
    document.getElementById(
        "messagesArea"
    );

if (messagesArea) {

    const observer =
        new MutationObserver(
            function () {

                setTimeout(
                    renderAllReactions,
                    50
                );

            }
        );

    observer.observe(
        messagesArea,
        {
            childList: true,
            subtree: true
        }
    );
}


/* =====================================================
   WINDOW EVENTS
===================================================== */

window.addEventListener(
    "scroll",
    hideReactionBar,
    true
);

window.addEventListener(
    "resize",
    hideReactionBar
);


/* =====================================================
   START
===================================================== */

createReactionBar();

console.log(
    "REACTION.JS READY ❤️"
);

})();