/* =========================================================
   STICKER.JS
   STICKER SYSTEM
   FIREBASE AUTH + FIRESTORE
   START OF FILE
========================================================= */


/* =========================================================
   START — ELEMENTS
========================================================= */

const stickerBtn =
    document.getElementById("stickerBtn");

const stickerPanel =
    document.getElementById("stickerPanel");

const stickerGrid =
    document.getElementById("stickerGrid");

const closeStickerBtn =
    document.getElementById("closeStickerBtn");

const emojiPanel =
    document.getElementById("emojiPanel");


/* =========================================================
   END — ELEMENTS
========================================================= */


/* =========================================================
   START — STATE
========================================================= */

let stickerSending =
    false;


/* =========================================================
   END — STATE
========================================================= */


/* =========================================================
   START — OPEN / CLOSE STICKER PANEL
========================================================= */

if (stickerBtn) {

    stickerBtn.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            if (!stickerPanel) {
                return;
            }

            const isOpen =
                stickerPanel.style.display !== "none";

            if (isOpen) {

                closeStickerPanel();

            } else {

                /*
                 * إغلاق Emoji
                 */

                if (emojiPanel) {

                    emojiPanel.style.display =
                        "none";

                }

                openStickerPanel();

            }

        }
    );

}


/* =========================================================
   END — OPEN / CLOSE STICKER PANEL
========================================================= */


/* =========================================================
   START — OPEN PANEL
========================================================= */

function openStickerPanel() {

    if (!stickerPanel) {
        return;
    }

    stickerPanel.style.display =
        "flex";

}


/* =========================================================
   END — OPEN PANEL
========================================================= */


/* =========================================================
   START — CLOSE PANEL
========================================================= */

function closeStickerPanel() {

    if (!stickerPanel) {
        return;
    }

    stickerPanel.style.display =
        "none";

}


/* =========================================================
   END — CLOSE PANEL
========================================================= */


/* =========================================================
   START — CLOSE BUTTON
========================================================= */

if (closeStickerBtn) {

    closeStickerBtn.addEventListener(
        "click",
        function () {

            closeStickerPanel();

        }
    );

}


/* =========================================================
   END — CLOSE BUTTON
========================================================= */


/* =========================================================
   START — SELECT STICKER
========================================================= */

if (stickerGrid) {

    stickerGrid.addEventListener(
        "click",
        async function (event) {

            /*
             * نبحث عن زر الاستيكر
             */

            const stickerItem =
                event.target.closest(
                    ".sticker-item"
                );


            if (!stickerItem) {
                return;
            }


            /*
             * منع أي رابط أو سلوك افتراضي
             */

            event.preventDefault();

            event.stopPropagation();


            const stickerNumber =
                stickerItem.dataset.sticker;


            if (!stickerNumber) {
                return;
            }


            await sendSticker(
                stickerNumber
            );

        }
    );

}


/* =========================================================
   END — SELECT STICKER
========================================================= */


/* =========================================================
   START — SEND STICKER
========================================================= */

async function sendSticker(
    stickerNumber
) {

    if (stickerSending) {
        return;
    }


    /*
     * المستخدم الحالي
     */

    const user =
        auth.currentUser;


    if (!user) {

        showStickerToast(
            "يجب تسجيل الدخول أولًا."
        );

        return;

    }


    stickerSending =
        true;


    /*
     * إظهار حالة الإرسال
     */

    if (
        typeof window.setSendingMedia ===
        "function"
    ) {

        window.setSendingMedia();

    }


    try {

        /*
         * اسم الاستيكر الموجود داخل المشروع
         */

        const stickerFile =
            stickerNumber + ".png";


        /*
         * بيانات الرسالة
         */

        const messageData = {

            uid:
                user.uid,

            senderId:
                user.uid,

            text:
                "",

            type:
                "sticker",

            sticker:
                stickerFile,

            stickerNumber:
                String(stickerNumber),

            /*
             * الاستيكر عادي
             */

            viewOnce:
                false,

            opened:
                false,

            /*
             * الاستيكر ليس صورة
             * ولا فيديو
             */

            isMedia:
                false,

            createdAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp()

        };


        /*
         * إرسال الرسالة من خلال chat.js
         */

        if (
            typeof window.saveChatMessage ===
            "function"
        ) {

            await window.saveChatMessage(
                messageData
            );

        } else {

            /*
             * احتياطي إذا لم تكن الدالة موجودة
             */

            await db
                .collection("messages")
                .add(
                    messageData
                );

        }


        /*
         * إغلاق لوحة الاستيكر
         */

        closeStickerPanel();


    } catch (error) {

        console.error(
            "SEND STICKER ERROR:",
            error
        );


        showStickerToast(
            "تعذر إرسال الاستيكر."
        );


    } finally {

        stickerSending =
            false;


        /*
         * إرجاع حالة الظهور
         */

        if (
            typeof window.setOnline ===
            "function"
        ) {

            window.setOnline();

        }

    }

}


/* =========================================================
   END — SEND STICKER
========================================================= */


/* =========================================================
   START — CLOSE OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        if (!stickerPanel) {
            return;
        }


        if (
            stickerPanel.style.display ===
            "none"
        ) {

            return;

        }


        if (
            stickerPanel.contains(
                event.target
            )
        ) {

            return;

        }


        if (
            stickerBtn &&
            stickerBtn.contains(
                event.target
            )
        ) {

            return;

        }


        closeStickerPanel();

    }
);


/* =========================================================
   END — CLOSE OUTSIDE
========================================================= */


/* =========================================================
   START — ESCAPE
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeStickerPanel();

        }

    }
);


/* =========================================================
   END — ESCAPE
========================================================= */


/* =========================================================
   START — TOAST
========================================================= */

function showStickerToast(
    message
) {

    let toast =
        document.getElementById(
            "stickerToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "stickerToast";


        toast.style.position =
            "fixed";


        toast.style.left =
            "50%";


        toast.style.bottom =
            "90px";


        toast.style.transform =
            "translateX(-50%)";


        toast.style.zIndex =
            "999999";


        toast.style.padding =
            "10px 18px";


        toast.style.borderRadius =
            "14px";


        toast.style.background =
            "rgba(20,20,25,.96)";


        toast.style.color =
            "#ffffff";


        toast.style.fontSize =
            "14px";


        toast.style.boxShadow =
            "0 8px 30px rgba(0,0,0,.35)";


        toast.style.whiteSpace =
            "nowrap";


        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.style.display =
        "block";


    clearTimeout(
        toast._timer
    );


    toast._timer =
        setTimeout(
            function () {

                toast.style.display =
                    "none";

            },
            2500
        );

}


/* =========================================================
   END — TOAST
========================================================= */


/* =========================================================
   START — PUBLIC FUNCTIONS
========================================================= */

window.openStickerPanel =
    openStickerPanel;


window.closeStickerPanel =
    closeStickerPanel;


window.sendSticker =
    sendSticker;


/* =========================================================
   END — PUBLIC FUNCTIONS
========================================================= */


/* =========================================================
   STICKER.JS
   END OF FILE
========================================================= */