/* =========================================================
   CHAT.JS
   PRIVATE CHAT — MOHAMED & RAHMA

   FIREBASE AUTH
   FIRESTORE
   SUPABASE MEDIA
   REPLY
   EDIT
   PIN
   DELETE
   READ
   IMAGE
   VIDEO
   VIEW ONCE
   STICKER
========================================================= */

console.log("CHAT.JS STARTED");


/* =========================================================
   CHAT SETTINGS
========================================================= */

const CHAT_ID = "mohamed_rahma";

let currentUser = null;
let currentUserProfile = {};

let otherUser = null;
let otherUserProfile = {};

let unsubscribeMessages = null;

let allMessages = [];

let selectedMessageId = null;
let selectedMessageData = null;

let replyToMessage = null;
let editingMessageId = null;


/* =========================================================
   FIRESTORE
========================================================= */

const messagesRef =
    db
        .collection("chats")
        .doc(CHAT_ID)
        .collection("messages");


/* =========================================================
   DOM
========================================================= */

const messagesArea =
    document.getElementById("messagesArea");

const chatEmpty =
    document.getElementById("chatEmpty");

const messageForm =
    document.getElementById("messageForm");

const messageInput =
    document.getElementById("messageInput");

const sendMessageBtn =
    document.getElementById("sendMessageBtn");


/* =========================================================
   HEADER
========================================================= */

const chatUserBtn =
    document.getElementById("chatUserBtn");

const chatUserName =
    document.getElementById("chatUserName");

const chatUserPhoto =
    document.getElementById("chatUserPhoto");

const chatUserPhotoFallback =
    document.getElementById("chatUserPhotoFallback");

const chatUserStatus =
    document.getElementById("chatUserStatus");

const onlineDot =
    document.getElementById("onlineDot");


/* =========================================================
   USER INFO
========================================================= */

const userInfoOverlay =
    document.getElementById("userInfoOverlay");

const closeUserInfoBtn =
    document.getElementById("closeUserInfoBtn");

const popupUserPhoto =
    document.getElementById("popupUserPhoto");

const popupUserFallback =
    document.getElementById("popupUserFallback");

const popupUserName =
    document.getElementById("popupUserName");

const popupUserEmail =
    document.getElementById("popupUserEmail");

const popupUserStatus =
    document.getElementById("popupUserStatus");


/* =========================================================
   REPLY
========================================================= */

const replyBar =
    document.getElementById("replyBar");

const replyBarName =
    document.getElementById("replyBarName");

const replyBarText =
    document.getElementById("replyBarText");

const cancelReplyBtn =
    document.getElementById("cancelReplyBtn");


/* =========================================================
   MESSAGE ACTIONS
========================================================= */

const messageActionOverlay =
    document.getElementById("messageActionOverlay");

const replyMessageBtn =
    document.getElementById("replyMessageBtn");

const editMessageBtn =
    document.getElementById("editMessageBtn");

const pinMessageBtn =
    document.getElementById("pinMessageBtn");

const deleteMessageBtn =
    document.getElementById("deleteMessageBtn");

const deleteForEveryoneBtn =
    document.getElementById("deleteForEveryoneBtn");

const cancelMessageActionBtn =
    document.getElementById("cancelMessageActionBtn");


/* =========================================================
   DELETE CONFIRM
========================================================= */

const deleteConfirmOverlay =
    document.getElementById("deleteConfirmOverlay");

const cancelDeleteBtn =
    document.getElementById("cancelDeleteBtn");

const confirmDeleteBtn =
    document.getElementById("confirmDeleteBtn");


/* =========================================================
   PINNED
========================================================= */

const pinnedBar =
    document.getElementById("pinnedBar");

const pinnedText =
    document.getElementById("pinnedText");

const closePinnedBtn =
    document.getElementById("closePinnedBtn");


/* =========================================================
   CHAT MENU
========================================================= */

const chatMenuBtn =
    document.getElementById("chatMenuBtn");

const chatMenuOverlay =
    document.getElementById("chatMenuOverlay");

const pinnedMenuBtn =
    document.getElementById("pinnedMenuBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const closeChatMenuBtn =
    document.getElementById("closeChatMenuBtn");


/* =========================================================
   MEDIA VIEWER
========================================================= */

const mediaViewer =
    document.getElementById("mediaViewer");

const mediaViewerContent =
    document.getElementById("mediaViewerContent");

const closeMediaViewer =
    document.getElementById("closeMediaViewer");


/* =========================================================
   VIEW ONCE
========================================================= */

const viewOnceViewer =
    document.getElementById("viewOnceViewer");

const viewOnceContent =
    document.getElementById("viewOnceContent");

const closeViewOnceViewer =
    document.getElementById("closeViewOnceViewer");


/* =========================================================
   HELPERS
========================================================= */

function getUserName(profile, user) {

    if (profile) {

        if (profile.username)
            return String(profile.username);

        if (profile.displayName)
            return String(profile.displayName);

        if (profile.name)
            return String(profile.name);
    }

    if (user) {

        if (user.displayName)
            return String(user.displayName);

        if (user.email)
            return String(user.email);
    }

    return "المستخدم";
}


function getUserPhoto(profile, user) {

    if (profile) {

        return (
            profile.photoUrl ||
            profile.photoURL ||
            profile.photo ||
            ""
        );
    }

    if (user && user.photoURL)
        return user.photoURL;

    return "";
}


function getTimestampNumber(timestamp) {

    if (!timestamp)
        return 0;

    try {

        if (
            typeof timestamp.toMillis ===
            "function"
        ) {

            return timestamp.toMillis();
        }

        if (
            typeof timestamp.toDate ===
            "function"
        ) {

            return timestamp
                .toDate()
                .getTime();
        }

        if (
            timestamp.seconds !== undefined
        ) {

            return (
                Number(timestamp.seconds) *
                1000
            );
        }

        return 0;

    } catch (error) {

        return 0;
    }
}


function formatMessageTime(timestamp) {

    const time =
        getTimestampNumber(timestamp);

    if (!time)
        return "";

    try {

        return new Date(time)
            .toLocaleTimeString(
                "ar-EG",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

    } catch (error) {

        return "";
    }
}


function formatVoiceDuration(seconds) {

    seconds =
        Number(seconds) || 0;

    const minutes =
        Math.floor(seconds / 60);

    const remainingSeconds =
        seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );
}


function getMessagePreviewText(message) {

    if (!message)
        return "رسالة";

    if (
        message.type === "image" ||
        message.mediaType === "image"
    ) {

        return "📷 صورة";
    }

    if (
        message.type === "video" ||
        message.mediaType === "video"
    ) {

        return "🎥 فيديو";
    }

    if (
        message.type === "voice"
    ) {

        return "🎤 رسالة صوتية";
    }

    if (
        message.type === "sticker"
    ) {

        return "😊 ملصق";
    }

    if (message.text)
        return String(message.text);

    return "رسالة";
}


function scrollToBottom() {

    if (!messagesArea)
        return;

    const performScroll = () => {
        messagesArea.scrollTo({
            top: messagesArea.scrollHeight,
            behavior: "smooth"
        });
    };

    performScroll();
    setTimeout(performScroll, 50);
    setTimeout(performScroll, 200);
}


/* =========================================================
   CURRENT USER
========================================================= */

async function loadCurrentUser() {

    if (!currentUser)
        return;

    try {

        const doc =
            await db
                .collection("users")
                .doc(currentUser.uid)
                .get();

        if (doc.exists) {

            currentUserProfile =
                doc.data() || {};

        } else {

            currentUserProfile = {};
        }

        currentUserProfile.uid =
            currentUser.uid;

        console.log(
            "CURRENT USER:",
            currentUserProfile
        );

    } catch (error) {

        console.error(
            "LOAD CURRENT USER ERROR:",
            error
        );
    }
}


/* =========================================================
   FIND OTHER USER
========================================================= */

async function findOtherUser() {

    try {

        const snapshot =
            await db
                .collection("users")
                .get();

        let found = null;


        snapshot.forEach(function (doc) {

            if (found)
                return;

            if (
                doc.id ===
                currentUser.uid
            )
                return;

            const data =
                doc.data() || {};

            const name =
                String(
                    data.username ||
                    data.displayName ||
                    data.name ||
                    ""
                ).toLowerCase();

            const email =
                String(
                    data.email ||
                    ""
                ).toLowerCase();

            if (
                name.includes("رحمه") ||
                name.includes("رحمة") ||
                name.includes("rahma") ||
                email.includes("rahma")
            ) {

                found = {

                    uid:
                        doc.id,

                    ...data
                };
            }

        });


        if (!found) {

            snapshot.forEach(function (doc) {

                if (found)
                    return;

                if (
                    doc.id !==
                    currentUser.uid
                ) {

                    found = {

                        uid:
                            doc.id,

                        ...doc.data()
                    };
                }

            });
        }


        if (found) {

            otherUser =
                found;

            otherUserProfile =
                found;

            updateOtherUserUI();

            console.log(
                "OTHER USER:",
                found
            );

        } else {

            console.warn(
                "OTHER USER NOT FOUND"
            );
        }

    } catch (error) {

        console.error(
            "FIND OTHER USER ERROR:",
            error
        );
    }
}


/* =========================================================
   OTHER USER UI
========================================================= */

function updateOtherUserUI() {

    if (!otherUser)
        return;

    const name =
        getUserName(
            otherUserProfile,
            otherUser
        );

    const photo =
        getUserPhoto(
            otherUserProfile,
            otherUser
        );


    if (chatUserName)
        chatUserName.textContent =
            name;


    if (
        photo &&
        chatUserPhoto
    ) {

        chatUserPhoto.src =
            photo;

        chatUserPhoto.style.display =
            "block";

        if (chatUserPhotoFallback)
            chatUserPhotoFallback.style.display =
                "none";

    } else {

        if (chatUserPhoto)
            chatUserPhoto.style.display =
                "none";

        if (chatUserPhotoFallback) {

            chatUserPhotoFallback.textContent =
                name.charAt(0);

            chatUserPhotoFallback.style.display =
                "flex";
        }
    }


    if (chatUserStatus)
        chatUserStatus.textContent =
            "غير متصل";

    if (onlineDot)
        onlineDot.style.display =
            "none";
}


/* =========================================================
   MESSAGE LISTENER
========================================================= */

function startMessagesListener() {

    if (!currentUser)
        return;

    if (unsubscribeMessages) {

        unsubscribeMessages();

        unsubscribeMessages =
            null;
    }


    console.log(
        "LISTENING:",
        `chats/${CHAT_ID}/messages`
    );


    unsubscribeMessages =
        messagesRef.onSnapshot(

            function (snapshot) {

                const messages = [];


                snapshot.forEach(function (doc) {

                    const data =
                        doc.data() || {};

                    const hiddenFor =
                        data.hiddenFor || {};


                    if (
                        hiddenFor[
                            currentUser.uid
                        ] === true
                    ) {

                        return;
                    }


                    messages.push({

                        id:
                            doc.id,

                        ...data
                    });

                });


                messages.sort(function (a, b) {

                    return (
                        getTimestampNumber(
                            a.createdAt
                        ) -
                        getTimestampNumber(
                            b.createdAt
                        )
                    );

                });


                allMessages =
                    messages;


                renderAllMessages(
                    messages
                );


                updatePinnedBar(
                    messages
                );


                markIncomingMessagesAsRead(
                    messages
                );

            },

            function (error) {

                console.error(
                    "FIRESTORE ERROR:",
                    error
                );
            }
        );
}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAllMessages(messages) {

    if (!messagesArea)
        return;

    messagesArea.innerHTML = "";


    if (!messages.length) {

        if (chatEmpty) {

            messagesArea.appendChild(
                chatEmpty
            );

            chatEmpty.style.display =
                "flex";
        }

        return;
    }


    if (chatEmpty)
        chatEmpty.style.display =
            "none";


    messages.forEach(function (message) {

        renderMessage(
            message
        );

    });


    scrollToBottom();
}


/* =========================================================
   RENDER MESSAGE
========================================================= */

function renderMessage(message) {

    const wrapper =
        document.createElement("div");


    wrapper.className =
        "message-wrapper";


    wrapper.dataset.messageId =
        message.id;


    const isMine =
        String(message.senderId) ===
        String(currentUser.uid);


    wrapper.classList.add(
        isMine
            ? "message-mine"
            : "message-other"
    );


    const bubble =
        document.createElement("div");


    bubble.className =
        "message-bubble";


    /* =====================================================
       DELETED
    ===================================================== */

    if (message.deleted === true) {

        const deleted =
            document.createElement("div");

        deleted.className =
            "deleted-message";

        deleted.textContent =
            "تم حذف هذه الرسالة";

        bubble.appendChild(
            deleted
        );

    } else {


        /* =================================================
           REPLY PREVIEW
        ================================================= */

        if (message.replyTo) {

            const reply =
                document.createElement("div");

            reply.className =
                "message-reply-preview";


            const name =
                document.createElement("strong");

            name.textContent =
                message.replyTo.senderName ||
                "رسالة";


            const text =
                document.createElement("span");

            text.textContent =
                message.replyTo.text ||
                "رسالة";


            reply.appendChild(name);
            reply.appendChild(text);


            reply.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    const target =
                        document.querySelector(
                            `[data-message-id="${message.replyTo.messageId}"]`
                        );


                    if (target) {

                        target.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });


                        target.classList.add(
                            "message-jump-highlight"
                        );


                        setTimeout(
                            function () {

                                target.classList.remove(
                                    "message-jump-highlight"
                                );

                            },
                            1500
                        );
                    }

                }
            );


            bubble.appendChild(
                reply
            );
        }


        /* =================================================
           TEXT
        ================================================= */

        if (
            message.type === "text" ||
            !message.type
        ) {

            const text =
                document.createElement("div");

            text.className =
                "message-text";

            text.textContent =
                message.text || "";

            bubble.appendChild(
                text
            );
        }


        /* =================================================
           STICKER
        ================================================= */

        if (
            message.type === "sticker"
        ) {

            const sticker =
                document.createElement("img");

            sticker.className =
                "message-sticker";

            const rawSticker = String(message.sticker || message.url || "1");
            sticker.src = rawSticker.includes(".") || rawSticker.startsWith("http")
                ? rawSticker
                : rawSticker + ".png";

            sticker.alt =
                "Sticker";

            sticker.style.maxWidth =
                "180px";

            sticker.style.maxHeight =
                "180px";

            bubble.appendChild(
                sticker
            );
        }


        /* =================================================
           IMAGE / VIEW ONCE
        ================================================= */

        const isImage =
            message.type === "image" ||
            (
                message.type === "media" &&
                message.mediaType === "image"
            );


        if (
            isImage &&
            (
                message.url ||
                message.mediaUrl
            )
        ) {

            const imageUrl =
                message.url ||
                message.mediaUrl;


            if (
                message.viewOnce === true
            ) {

                const box =
                    document.createElement("div");

                box.className =
                    "view-once-media-button";

                box.style.padding =
                    "14px";

                box.style.borderRadius =
                    "14px";

                box.style.background =
                    "rgba(255,255,255,.08)";

                box.style.cursor =
                    message.opened === true
                        ? "default"
                        : "pointer";


                const icon =
                    document.createElement("div");

                icon.style.fontSize =
                    "30px";

                icon.textContent =
                    "①";


                const title =
                    document.createElement("div");

                title.style.fontWeight =
                    "bold";

                title.textContent =
                    "صورة للمشاهدة مرة واحدة";


                const status =
                    document.createElement("small");

                status.style.opacity =
                    ".7";


                if (
                    message.opened === true
                ) {

                    status.textContent =
                        "تم فتحها بالفعل";

                    box.style.opacity =
                        ".5";

                } else {

                    status.textContent =
                        "اضغط لفتح الصورة";
                }


                box.appendChild(icon);
                box.appendChild(title);
                box.appendChild(status);


                if (
                    message.opened !== true
                ) {

                    box.addEventListener(
                        "click",
                        function (event) {

                            event.stopPropagation();

                            openViewOnceMedia(
                                message
                            );
                        }
                    );
                }


                bubble.appendChild(
                    box
                );

            } else {

                const image =
                    document.createElement("img");

                image.src =
                    imageUrl;

                image.alt =
                    "صورة";

                image.loading =
                    "lazy";

                image.style.maxWidth =
                    "100%";

                image.style.maxHeight =
                    "400px";

                image.style.objectFit =
                    "contain";

                image.style.borderRadius =
                    "10px";

                image.style.cursor =
                    "pointer";


                image.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();

                        openMedia(
                            "image",
                            imageUrl
                        );

                    }
                );


                bubble.appendChild(
                    image
                );
            }
        }


        /* =================================================
           VIDEO / VIEW ONCE
        ================================================= */

        const isVideo =
            message.type === "video" ||
            (
                message.type === "media" &&
                message.mediaType === "video"
            );


        if (
            isVideo &&
            (
                message.url ||
                message.mediaUrl
            )
        ) {

            const videoUrl =
                message.url ||
                message.mediaUrl;


            if (
                message.viewOnce === true
            ) {

                const box =
                    document.createElement("div");

                box.className =
                    "view-once-media-button";

                box.style.padding =
                    "14px";

                box.style.borderRadius =
                    "14px";

                box.style.background =
                    "rgba(255,255,255,.08)";

                box.style.cursor =
                    message.opened === true
                        ? "default"
                        : "pointer";


                const icon =
                    document.createElement("div");

                icon.style.fontSize =
                    "30px";

                icon.textContent =
                    "▶";


                const title =
                    document.createElement("div");

                title.style.fontWeight =
                    "bold";

                title.textContent =
                    "فيديو للمشاهدة مرة واحدة";


                const status =
                    document.createElement("small");

                status.style.opacity =
                    ".7";


                if (
                    message.opened === true
                ) {

                    status.textContent =
                        "تم فتحه بالفعل";

                    box.style.opacity =
                        ".5";

                } else {

                    status.textContent =
                        "اضغط لمشاهدة الفيديو";
                }


                box.appendChild(icon);
                box.appendChild(title);
                box.appendChild(status);


                if (
                    message.opened !== true
                ) {

                    box.addEventListener(
                        "click",
                        function (event) {

                            event.stopPropagation();

                            openViewOnceMedia(
                                message
                            );
                        }
                    );
                }


                bubble.appendChild(
                    box
                );

            } else {

                const video =
                    document.createElement("video");

                video.src =
                    videoUrl;

                video.controls =
                    true;

                video.playsInline =
                    true;

                video.preload =
                    "metadata";

                video.style.maxWidth =
                    "100%";

                video.style.maxHeight =
                    "400px";

                video.style.borderRadius =
                    "10px";


                bubble.appendChild(
                    video
                );
            }
        }


        /* =================================================
           VOICE
        ================================================= */

        if (
            message.type === "voice" &&
            message.url
        ) {

            const voiceBox =
                document.createElement("div");

            voiceBox.className =
                "voice-message";


            const audio =
                document.createElement("audio");

            audio.src =
                message.url;

            audio.controls =
                true;

            audio.preload =
                "metadata";

            audio.style.width =
                "220px";


            voiceBox.appendChild(
                audio
            );


            if (
                message.duration !== undefined &&
                message.duration !== null
            ) {

                const duration =
                    document.createElement("small");

                duration.className =
                    "voice-duration";

                duration.textContent =
                    formatVoiceDuration(
                        message.duration
                    );

                voiceBox.appendChild(
                    duration
                );
            }


            bubble.appendChild(
                voiceBox
            );
        }


        /* =================================================
           EDITED
        ================================================= */

        if (
            message.edited === true
        ) {

            const edited =
                document.createElement("small");

            edited.className =
                "message-edited";

            edited.textContent =
                "تم التعديل";

            bubble.appendChild(
                edited
            );
        }
    }


    /* =====================================================
       FOOTER
    ===================================================== */

    const footer =
        document.createElement("div");

    footer.className =
        "message-footer";


    const time =
        document.createElement("span");

    time.className =
        "message-time";

    time.textContent =
        formatMessageTime(
            message.createdAt
        );

    footer.appendChild(
        time
    );


    /* =====================================================
       READ CHECKS
    ===================================================== */

    if (isMine) {

        const checks =
            document.createElement("span");

        checks.className =
            "message-checks";


        const readBy =
            message.readBy || {};


        let isRead =
            false;


        Object.keys(
            readBy
        ).forEach(function (uid) {

            if (
                String(uid) !==
                String(currentUser.uid) &&
                readBy[uid] === true
            ) {

                isRead =
                    true;
            }

        });


        checks.textContent =
            isRead
                ? "✓✓"
                : "✓";


        footer.appendChild(
            checks
        );
    }


    bubble.appendChild(
        footer
    );


    wrapper.appendChild(
        bubble
    );


    bubble.addEventListener(
        "click",
        function () {

            openMessageActions(
                message
            );

        }
    );


    messagesArea.appendChild(
        wrapper
    );
}


/* =========================================================
   SEND STICKER
========================================================= */

async function sendSticker(stickerName) {

    if (!currentUser)
        return;

    const data = {

        senderId:
            currentUser.uid,

        senderName:
            getUserName(
                currentUserProfile,
                currentUser
            ),

        senderEmail:
            currentUser.email ||
            "",

        type:
            "sticker",

        sticker:
            stickerName,

        createdAt:
            firebase.firestore
                .FieldValue
                .serverTimestamp(),

        edited:
            false,

        deleted:
            false,

        pinned:
            false,

        readBy: {

            [currentUser.uid]:
                true
        },

        hiddenFor:
            {}

    };


    if (replyToMessage) {

        data.replyTo = {

            messageId:
                replyToMessage.id,

            senderId:
                replyToMessage.senderId,

            senderName:
                replyToMessage.senderName ||
                "",

            text:
                getMessagePreviewText(
                    replyToMessage
                )
        };
    }


    try {

        await messagesRef.add(
            data
        );


        clearReply();

        scrollToBottom();


    } catch (error) {

        console.error(
            "SEND STICKER ERROR:",
            error
        );

        alert(
            "فشل إرسال الملصق:\n" +
            error.message
        );
    }
}


window.sendSticker =
    sendSticker;


/* =========================================================
   ADD MEDIA MESSAGE
========================================================= */

async function addMediaMessage(mediaData) {

    if (
        !currentUser ||
        !currentUser.uid
    ) {

        throw new Error(
            "USER_NOT_LOGGED_IN"
        );
    }


    if (!mediaData) {

        throw new Error(
            "MEDIA_DATA_MISSING"
        );
    }


    const messageData = {

        senderId:
            currentUser.uid,

        senderName:
            getUserName(
                currentUserProfile,
                currentUser
            ),

        senderEmail:
            currentUser.email ||
            "",

        type:
            "media",

        mediaType:
            mediaData.type,

        mediaUrl:
            mediaData.url,

        mediaPath:
            mediaData.path || "",

        fileName:
            mediaData.fileName || "",

        mimeType:
            mediaData.mimeType || "",

        fileSize:
            Number(
                mediaData.fileSize
            ) || 0,

        viewOnce:
            mediaData.viewOnce === true,

        opened:
            false,

        openedBy:
            {},

        createdAt:
            firebase.firestore
                .FieldValue
                .serverTimestamp(),

        edited:
            false,

        deleted:
            false,

        pinned:
            false,

        readBy: {

            [currentUser.uid]:
                true
        },

        hiddenFor:
            {}

    };


    if (replyToMessage) {

        messageData.replyTo = {

            messageId:
                replyToMessage.id,

            senderId:
                replyToMessage.senderId,

            senderName:
                replyToMessage.senderName ||
                "",

            text:
                getMessagePreviewText(
                    replyToMessage
                )
        };
    }


    await messagesRef.add(
        messageData
    );


    clearReply();

    scrollToBottom();


    console.log(
        "MEDIA MESSAGE SAVED"
    );
}


window.addMediaMessage =
    addMediaMessage;


/* =========================================================
   SAVE CHAT MESSAGE
========================================================= */

async function saveChatMessage(messageData) {

    if (!currentUser)
        throw new Error(
            "USER_NOT_LOGGED_IN"
        );


    const data =
        messageData || {};


    data.senderId =
        currentUser.uid;


    if (!data.senderName) {

        data.senderName =
            getUserName(
                currentUserProfile,
                currentUser
            );
    }


    if (!data.senderEmail) {

        data.senderEmail =
            currentUser.email || "";
    }


    if (!data.type) {

        data.type =
            "text";
    }


    if (
        data.edited === undefined
    ) {

        data.edited =
            false;
    }


    if (
        data.deleted === undefined
    ) {

        data.deleted =
            false;
    }


    if (
        data.pinned === undefined
    ) {

        data.pinned =
            false;
    }


    if (
        data.hiddenFor === undefined
    ) {

        data.hiddenFor =
            {};
    }


    if (!data.readBy) {

        data.readBy = {

            [currentUser.uid]:
                true
        };

    } else {

        data.readBy[
            currentUser.uid
        ] = true;
    }


    if (!data.createdAt) {

        data.createdAt =
            firebase.firestore
                .FieldValue
                .serverTimestamp();
    }


    const ref =
        await messagesRef.add(
            data
        );


    return ref.id;
}


window.saveChatMessage =
    saveChatMessage;


/* =========================================================
   SEND TEXT
========================================================= */

if (sendMessageBtn) {

    const preventBlur = (e) => e.preventDefault();

    sendMessageBtn.addEventListener("mousedown", preventBlur);

    sendMessageBtn.addEventListener("touchstart", preventBlur);
}

if (messageForm) {

    messageForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!currentUser)
                return;


            const text =
                messageInput
                    ? messageInput.value.trim()
                    : "";


            if (!text)
                return;


            if (editingMessageId) {

                try {

                    await messagesRef
                        .doc(
                            editingMessageId
                        )
                        .update({

                            text:
                                text,

                            edited:
                                true,

                            editedAt:
                                firebase.firestore
                                    .FieldValue
                                    .serverTimestamp()

                        });


                    editingMessageId =
                        null;


                    messageInput.value =
                        "";


                    updateSendButton();

                    autoResizeTextarea();

                    scrollToBottom();


                } catch (error) {

                    console.error(
                        "EDIT ERROR:",
                        error
                    );

                    alert(
                        "فشل تعديل الرسالة:\n" +
                        error.message
                    );
                }

                return;
            }


            const data = {

                senderId:
                    currentUser.uid,

                senderName:
                    getUserName(
                        currentUserProfile,
                        currentUser
                    ),

                senderEmail:
                    currentUser.email ||
                    "",

                type:
                    "text",

                text:
                    text,

                createdAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp(),

                edited:
                    false,

                deleted:
                    false,

                pinned:
                    false,

                readBy: {

                    [currentUser.uid]:
                        true
                },

                hiddenFor:
                    {}

            };


            if (replyToMessage) {

                data.replyTo = {

                    messageId:
                        replyToMessage.id,

                    senderId:
                        replyToMessage.senderId,

                    senderName:
                        replyToMessage.senderName ||
                        "",

                    text:
                        getMessagePreviewText(
                            replyToMessage
                        )
                };
            }


            // 1. إظهار الرسالة فوراً في الواجهة لتفادي تأخير الـ 8 ثوانٍ
            const optimisticTempId = "temp_" + Date.now();
            const optimisticMessage = {
                id: optimisticTempId,
                ...data,
                createdAt: { toMillis: () => Date.now() }
            };

            renderMessage(optimisticMessage);

            // 2. تصفير المدخلات وإعادة ضبط الحجم فوراً
            messageInput.value = "";
            autoResizeTextarea();
            clearReply();
            scrollToBottom();

            try {

                // 3. الإرسال إلى Firestore في الخلفية
                await messagesRef.add(
                    data
                );

            } catch (error) {

                console.error(
                    "SEND ERROR:",
                    error
                );

                // إزالة الرسالة المؤقتة في حالة وجود خطأ
                const tempEl = document.querySelector(`[data-message-id="${optimisticTempId}"]`);
                if (tempEl) tempEl.remove();

                alert(
                    "فشل إرسال الرسالة:\n" +
                    error.message
                );

            }
        }
    );
}


/* =========================================================
   REPLY
========================================================= */

function openReply(message) {

    if (!message)
        return;


    replyToMessage =
        message;


    if (replyBar)
        replyBar.style.display =
            "flex";


    if (replyBarName)
        replyBarName.textContent =
            message.senderName ||
            "الرد";


    if (replyBarText)
        replyBarText.textContent =
            getMessagePreviewText(
                message
            );


    closeMessageActions();


    if (messageInput)
        messageInput.focus();
}


function clearReply() {

    replyToMessage =
        null;


    if (replyBar)
        replyBar.style.display =
            "none";
}


if (cancelReplyBtn) {

    cancelReplyBtn.addEventListener(
        "click",
        clearReply
    );
}


if (replyMessageBtn) {

    replyMessageBtn.addEventListener(
        "click",
        function () {

            if (
                selectedMessageData
            ) {

                openReply(
                    selectedMessageData
                );
            }

        }
    );
}


/* =========================================================
   MESSAGE ACTIONS
========================================================= */

function openMessageActions(message) {

    if (!message)
        return;


    selectedMessageId =
        message.id;


    selectedMessageData =
        message;


    const isMine =
        String(message.senderId) ===
        String(currentUser.uid);


    const isDeleted =
        message.deleted === true;


    if (editMessageBtn) {

        editMessageBtn.style.display =
            (
                isMine &&
                !isDeleted &&
                (
                    message.type === "text" ||
                    !message.type
                )
            )
                ? "block"
                : "none";
    }


    if (deleteForEveryoneBtn) {

        deleteForEveryoneBtn.style.display =
            (
                isMine &&
                !isDeleted
            )
                ? "block"
                : "none";
    }


    if (deleteMessageBtn) {

        deleteMessageBtn.style.display =
            isDeleted
                ? "none"
                : "block";
    }


    if (pinMessageBtn) {

        pinMessageBtn.style.display =
            isDeleted
                ? "none"
                : "block";


        pinMessageBtn.innerHTML =
            message.pinned === true
                ? "📌 <span>إلغاء تثبيت</span>"
                : "📌 <span>تثبيت الرسالة</span>";
    }


    if (messageActionOverlay) {

        messageActionOverlay.style.display =
            "flex";
    }
}


function closeMessageActions() {

    if (messageActionOverlay) {

        messageActionOverlay.style.display =
            "none";
    }
}


if (cancelMessageActionBtn) {

    cancelMessageActionBtn.addEventListener(
        "click",
        closeMessageActions
    );
}


/* =========================================================
   EDIT
========================================================= */

if (editMessageBtn) {

    editMessageBtn.addEventListener(
        "click",
        function () {

            if (!selectedMessageData)
                return;


            if (
                String(
                    selectedMessageData.senderId
                ) !==
                String(
                    currentUser.uid
                )
            )
                return;


            editingMessageId =
                selectedMessageData.id;


            if (messageInput) {

                messageInput.value =
                    selectedMessageData.text ||
                    "";

                messageInput.focus();

                autoResizeTextarea();
            }


            updateSendButton();

            closeMessageActions();
        }
    );
}


/* =========================================================
   DELETE FOR ME
========================================================= */

if (deleteMessageBtn) {

    deleteMessageBtn.addEventListener(
        "click",
        function () {

            closeMessageActions();


            if (deleteConfirmOverlay) {

                deleteConfirmOverlay.style.display =
                    "flex";
            }
        }
    );
}


if (cancelDeleteBtn) {

    cancelDeleteBtn.addEventListener(
        "click",
        function () {

            if (deleteConfirmOverlay) {

                deleteConfirmOverlay.style.display =
                    "none";
            }
        }
    );
}


if (confirmDeleteBtn) {

    confirmDeleteBtn.addEventListener(
        "click",
        async function () {

            if (
                !selectedMessageId ||
                !currentUser
            )
                return;


            try {

                await messagesRef
                    .doc(
                        selectedMessageId
                    )
                    .update({

                        [`hiddenFor.${currentUser.uid}`]:
                            true
                    });

            } catch (error) {

                console.error(
                    "DELETE ME ERROR:",
                    error
                );

                alert(
                    "فشل الحذف:\n" +
                    error.message
                );
            }


            if (deleteConfirmOverlay) {

                deleteConfirmOverlay.style.display =
                    "none";
            }


            selectedMessageId =
                null;

            selectedMessageData =
                null;
        }
    );
}


/* =========================================================
   DELETE FOR EVERYONE
========================================================= */

if (deleteForEveryoneBtn) {

    deleteForEveryoneBtn.addEventListener(
        "click",
        async function () {

            const message =
                selectedMessageData;


            if (!message)
                return;


            if (
                String(message.senderId) !==
                String(currentUser.uid)
            )
                return;


            try {

                await messagesRef
                    .doc(
                        message.id
                    )
                    .update({

                        deleted:
                            true,

                        text:
                            "",

                        mediaUrl:
                            "",

                        url:
                            "",

                        pinned:
                            false,

                        deletedAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp()
                    });

            } catch (error) {

                console.error(
                    "DELETE EVERYONE ERROR:",
                    error
                );

                alert(
                    "فشل حذف الرسالة للجميع:\n" +
                    error.message
                );
            }


            closeMessageActions();


            selectedMessageId =
                null;

            selectedMessageData =
                null;
        }
    );
}


/* =========================================================
   PIN
========================================================= */

if (pinMessageBtn) {

    pinMessageBtn.addEventListener(
        "click",
        async function () {

            const message =
                selectedMessageData;


            if (!message)
                return;


            const newPinned =
                message.pinned !== true;


            try {

                const updateData = {

                    pinned:
                        newPinned
                };


                if (newPinned) {

                    updateData.pinnedAt =
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp();

                } else {

                    updateData.pinnedAt =
                        firebase.firestore
                            .FieldValue
                            .delete();
                }


                await messagesRef
                    .doc(
                        message.id
                    )
                    .update(
                        updateData
                    );

            } catch (error) {

                console.error(
                    "PIN ERROR:",
                    error
                );

                alert(
                    "فشل تثبيت الرسالة:\n" +
                    error.message
                );
            }


            closeMessageActions();
        }
    );
}


/* =========================================================
   PINNED BAR
========================================================= */

function updatePinnedBar(messages) {

    if (!pinnedBar)
        return;


    const pinned =
        messages.filter(
            function (message) {

                return (
                    message.pinned === true &&
                    message.deleted !== true
                );
            }
        );


    if (!pinned.length) {

        pinnedBar.style.display =
            "none";

        return;
    }


    const message =
        pinned[
            pinned.length - 1
        ];


    pinnedBar.style.display =
        "flex";


    if (pinnedText) {

        pinnedText.textContent =
            getMessagePreviewText(
                message
            );
    }
}


if (pinnedBar) {

    pinnedBar.addEventListener(
        "click",
        function () {

            const pinned =
                allMessages.filter(
                    function (message) {

                        return (
                            message.pinned === true &&
                            message.deleted !== true
                        );
                    }
                );


            if (!pinned.length)
                return;


            const message =
                pinned[
                    pinned.length - 1
                ];


            const element =
                document.querySelector(
                    `[data-message-id="${message.id}"]`
                );


            if (element) {

                element.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });


                element.classList.add(
                    "message-jump-highlight"
                );


                setTimeout(
                    function () {

                        element.classList.remove(
                            "message-jump-highlight"
                        );

                    },
                    1500
                );
            }
        }
    );
}


/* =========================================================
   CLOSE PINNED
========================================================= */

if (closePinnedBtn) {

    closePinnedBtn.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            if (pinnedBar)
                pinnedBar.style.display =
                    "none";
        }
    );
}


/* =========================================================
   SHOW PINNED
========================================================= */

function showPinnedMessages() {

    const pinned =
        allMessages.filter(
            function (message) {

                return (
                    message.pinned === true &&
                    message.deleted !== true
                );
            }
        );


    if (!pinned.length) {

        alert(
            "لا توجد رسائل مثبتة."
        );

        return;
    }


    const message =
        pinned[
            pinned.length - 1
        ];


    const element =
        document.querySelector(
            `[data-message-id="${message.id}"]`
        );


    if (element) {

        element.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


        element.classList.add(
            "message-jump-highlight"
        );


        setTimeout(
            function () {

                element.classList.remove(
                    "message-jump-highlight"
                );

            },
            1500
        );
    }
}


/* =========================================================
   READ
========================================================= */

async function markIncomingMessagesAsRead(
    messages
) {

    if (!currentUser)
        return;


    const batch =
        db.batch();

    let changed =
        false;


    messages.forEach(function (message) {

        if (
            String(message.senderId) ===
            String(currentUser.uid)
        )
            return;


        if (
            message.deleted === true
        )
            return;


        const readBy =
            message.readBy || {};


        if (
            readBy[
                currentUser.uid
            ] === true
        )
            return;


        batch.update(

            messagesRef.doc(
                message.id
            ),

            {

                [`readBy.${currentUser.uid}`]:
                    true,

                readAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()
            }
        );


        changed =
            true;
    });


    if (!changed)
        return;


    try {

        await batch.commit();

    } catch (error) {

        console.error(
            "READ ERROR:",
            error
        );
    }
}


/* =========================================================
   MEDIA VIEWER
========================================================= */

function openMedia(type, url) {

    if (
        !mediaViewer ||
        !mediaViewerContent ||
        !url
    )
        return;


    mediaViewerContent.innerHTML =
        "";


    if (type === "image") {

        const img =
            document.createElement("img");

        img.src =
            url;

        img.style.maxWidth =
            "100%";

        img.style.maxHeight =
            "90vh";

        img.style.objectFit =
            "contain";

        mediaViewerContent.appendChild(
            img
        );
    }


    if (type === "video") {

        const video =
            document.createElement("video");

        video.src =
            url;

        video.controls =
            true;

        video.autoplay =
            true;

        video.playsInline =
            true;

        video.style.maxWidth =
            "100%";

        video.style.maxHeight =
            "90vh";

        mediaViewerContent.appendChild(
            video
        );
    }


    mediaViewer.style.display =
        "flex";
}


window.openMedia =
    openMedia;


/* =========================================================
   VIEW ONCE
   NO DOWNLOAD BUTTON
========================================================= */

async function openViewOnceMedia(message) {

    if (!message)
        return;


    if (!currentUser)
        return;


    if (
        message.viewOnce !== true
    )
        return;


    if (
        message.opened === true
    ) {

        showChatToast(
            "تم فتح هذه الرسالة من قبل."
        );

        return;
    }


    if (!message.mediaUrl)
        return;


    try {

        if (
            !viewOnceViewer ||
            !viewOnceContent
        ) {

            return;
        }


        viewOnceContent.innerHTML =
            "";


        /* =================================================
           IMAGE — VIEW ONCE
           NO DOWNLOAD BUTTON
        ================================================= */

        if (
            message.mediaType ===
            "image"
        ) {

            const img =
                document.createElement("img");

            img.src =
                message.mediaUrl;

            img.alt =
                "صورة للمشاهدة مرة واحدة";

            img.draggable =
                false;

            img.style.maxWidth =
                "100%";

            img.style.maxHeight =
                "80vh";

            img.style.objectFit =
                "contain";

            img.style.userSelect =
                "none";

            img.style.webkitUserSelect =
                "none";

            img.addEventListener(
                "contextmenu",
                function (event) {

                    event.preventDefault();

                }
            );


            viewOnceContent.appendChild(
                img
            );
        }


        /* =================================================
           VIDEO — VIEW ONCE
           REMOVE DOWNLOAD BUTTON
        ================================================= */

        else if (
            message.mediaType ===
            "video"
        ) {

            const video =
                document.createElement("video");

            video.src =
                message.mediaUrl;

            video.controls =
                true;

            video.autoplay =
                true;

            video.playsInline =
                true;

            video.preload =
                "metadata";

            video.setAttribute(
                "controlsList",
                "nodownload noremoteplayback"
            );

            video.disablePictureInPicture =
                true;

            video.setAttribute(
                "disablePictureInPicture",
                ""
            );

            video.style.maxWidth =
                "100%";

            video.style.maxHeight =
                "80vh";


            viewOnceContent.appendChild(
                video
            );
        }


        viewOnceViewer.style.display =
            "flex";


        /* =================================================
           MARK OPENED
        ================================================= */

        await messagesRef
            .doc(message.id)
            .update({

                opened:
                    true,

                [`openedBy.${currentUser.uid}`]:
                    true,

                openedAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()
            });


        /* =================================================
           LOCAL UPDATE
        ================================================= */

        const localMessage =
            allMessages.find(
                function (item) {

                    return (
                        item.id ===
                        message.id
                    );
                }
            );


        if (localMessage) {

            localMessage.opened =
                true;
        }


    } catch (error) {

        console.error(
            "VIEW ONCE ERROR:",
            error
        );


        showChatToast(
            "تعذر فتح الرسالة."
        );
    }
}


window.openViewOnceMedia =
    openViewOnceMedia;


/* =========================================================
   CLOSE VIEW ONCE
========================================================= */

if (closeViewOnceViewer) {

    closeViewOnceViewer.addEventListener(
        "click",
        function () {

            if (viewOnceViewer) {

                viewOnceViewer.style.display =
                    "none";
            }


            if (viewOnceContent) {

                const video =
                    viewOnceContent.querySelector(
                        "video"
                    );


                if (video) {

                    video.pause();

                    video.removeAttribute(
                        "src"
                    );

                    video.load();
                }


                viewOnceContent.innerHTML =
                    "";
            }
        }
    );
}


/* =========================================================
   CLOSE MEDIA VIEWER
========================================================= */

if (closeMediaViewer) {

    closeMediaViewer.addEventListener(
        "click",
        function () {

            if (mediaViewer) {

                mediaViewer.style.display =
                    "none";
            }


            if (mediaViewerContent) {

                const video =
                    mediaViewerContent.querySelector(
                        "video"
                    );


                if (video) {

                    video.pause();

                    video.removeAttribute(
                        "src"
                    );

                    video.load();
                }


                mediaViewerContent.innerHTML =
                    "";
            }
        }
    );
}


/* =========================================================
   CHAT MENU
========================================================= */

if (chatMenuBtn) {

    chatMenuBtn.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            if (chatMenuOverlay) {

                chatMenuOverlay.style.display =
                    "flex";
            }
        }
    );
}


function closeChatMenu() {

    if (chatMenuOverlay) {

        chatMenuOverlay.style.display =
            "none";
    }
}


if (closeChatMenuBtn) {

    closeChatMenuBtn.addEventListener(
        "click",
        closeChatMenu
    );
}


if (pinnedMenuBtn) {

    pinnedMenuBtn.addEventListener(
        "click",
        function () {

            closeChatMenu();

            showPinnedMessages();
        }
    );
}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function () {

            try {

                await auth.signOut();

                window.location.href =
                    "index.html";

            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

                alert(
                    "فشل تسجيل الخروج."
                );
            }
        }
    );
}


/* =========================================================
   USER INFO
========================================================= */

function openUserInfo() {

    if (!otherUser)
        return;


    const name =
        getUserName(
            otherUserProfile,
            otherUser
        );


    const photo =
        getUserPhoto(
            otherUserProfile,
            otherUser
        );


    if (popupUserName)
        popupUserName.textContent =
            name;


    if (popupUserEmail)
        popupUserEmail.textContent =
            otherUser.email ||
            otherUserProfile.email ||
            "";


    if (popupUserStatus)
        popupUserStatus.textContent =
            "غير متصل";


    if (
        photo &&
        popupUserPhoto
    ) {

        popupUserPhoto.src =
            photo;

        popupUserPhoto.style.display =
            "block";


        if (popupUserFallback)
            popupUserFallback.style.display =
                "none";

    } else {

        if (popupUserPhoto)
            popupUserPhoto.style.display =
                "none";


        if (popupUserFallback) {

            popupUserFallback.textContent =
                name.charAt(0);

            popupUserFallback.style.display =
                "flex";
        }
    }


    if (userInfoOverlay) {

        userInfoOverlay.style.display =
            "flex";
    }
}


function closeUserInfo() {

    if (userInfoOverlay) {

        userInfoOverlay.style.display =
            "none";
    }
}


if (chatUserBtn) {

    chatUserBtn.addEventListener(
        "click",
        openUserInfo
    );
}


if (closeUserInfoBtn) {

    closeUserInfoBtn.addEventListener(
        "click",
        closeUserInfo
    );
}


/* =========================================================
   TOAST
========================================================= */

function showChatToast(message) {

    let toast =
        document.getElementById(
            "chatToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "chatToast";


        toast.style.position =
            "fixed";

        toast.style.left =
            "50%";

        toast.style.bottom =
            "90px";

        toast.style.transform =
            "translateX(-50%)";

        toast.style.zIndex =
            "100000";

        toast.style.padding =
            "10px 18px";

        toast.style.borderRadius =
            "14px";

        toast.style.background =
            "rgba(20,20,25,.95)";

        toast.style.color =
            "#fff";

        toast.style.fontSize =
            "14px";

        toast.style.textAlign =
            "center";

        toast.style.maxWidth =
            "90%";

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


window.showChatToast =
    showChatToast;


/* =========================================================
   TEXTAREA
========================================================= */

function autoResizeTextarea() {

    if (!messageInput)
        return;


    messageInput.style.height =
        "auto";


    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            140
        ) + "px";
}


function updateSendButton() {

    if (!sendMessageBtn)
        return;


    if (editingMessageId) {

        sendMessageBtn.textContent =
            "حفظ";

    } else {

        sendMessageBtn.textContent =
            "إرسال";
    }
}


if (messageInput) {

    messageInput.addEventListener(
        "input",
        function () {

            autoResizeTextarea();

            updateSendButton();
        }
    );
}


/* =========================================================
   CLOSE OVERLAYS WHEN CLICKING OUTSIDE
========================================================= */

if (messageActionOverlay) {

    messageActionOverlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                messageActionOverlay
            ) {

                closeMessageActions();
            }
        }
    );
}


if (deleteConfirmOverlay) {

    deleteConfirmOverlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                deleteConfirmOverlay
            ) {

                deleteConfirmOverlay.style.display =
                    "none";
            }
        }
    );
}


if (chatMenuOverlay) {

    chatMenuOverlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                chatMenuOverlay
            ) {

                closeChatMenu();
            }
        }
    );
}


if (userInfoOverlay) {

    userInfoOverlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                userInfoOverlay
            ) {

                closeUserInfo();
            }
        }
    );
}


if (mediaViewer) {

    mediaViewer.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                mediaViewer
            ) {

                if (closeMediaViewer)
                    closeMediaViewer.click();
            }
        }
    );
}


/* =========================================================
   AUTH START
========================================================= */

if (
    typeof auth !== "undefined" &&
    auth
) {

    auth.onAuthStateChanged(
        async function (user) {

            console.log(
                "AUTH STATE:",
                user
            );


            if (!user) {

                currentUser =
                    null;

                setTimeout(function() {
                    if (!auth.currentUser) {
                        window.location.href = "index.html";
                    }
                }, 1000);

                return;
            }


            currentUser =
                user;


            try {

                await loadCurrentUser();

                await findOtherUser();

                startMessagesListener();


                console.log(
                    "CHAT READY FOR:",
                    currentUser.uid
                );

            } catch (error) {

                console.error(
                    "CHAT START ERROR:",
                    error
                );
            }
        }
    );

} else {

    console.error(
        "AUTH IS NOT DEFINED"
    );
}


/* =========================================================
   GLOBALS
========================================================= */

window.currentUser =
    currentUser;

window.allMessages =
    allMessages;


/* =========================================================
   END
========================================================= */

console.log(
    "CHAT.JS READY"
);
