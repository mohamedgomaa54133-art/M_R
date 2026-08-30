/* =========================================================
   UPLOAD.JS
   CLOUDINARY STORAGE
   FIREBASE AUTH
   IMAGE / VIDEO / VIEW ONCE

   CLOUDINARY:
   Cloud Name   = iir6bqt7
   Upload Preset = chat_upload
========================================================= */

console.log("UPLOAD.JS STARTED");


/* =========================================================
   CLOUDINARY CONFIG
========================================================= */

const CLOUDINARY_CLOUD_NAME =
    "iir6bqt7";

const CLOUDINARY_UPLOAD_PRESET =
    "chat_upload";

const CLOUDINARY_UPLOAD_URL =
    "https://api.cloudinary.com/v1_1/" +
    CLOUDINARY_CLOUD_NAME +
    "/auto/upload";


/* =========================================================
   LIMITS
========================================================= */

const MAX_IMAGE_SIZE =
    15 * 1024 * 1024;

const MAX_VIDEO_SIZE =
    100 * 1024 * 1024;


/* =========================================================
   DOM
========================================================= */

const uploadAttachmentBtn =
    document.getElementById(
        "attachmentBtn"
    );

const uploadAttachmentPanel =
    document.getElementById(
        "attachmentPanel"
    );

const uploadImageOption =
    document.getElementById(
        "imageOption"
    );

const uploadVideoOption =
    document.getElementById(
        "videoOption"
    );

const uploadImageInput =
    document.getElementById(
        "imageInput"
    );

const uploadVideoInput =
    document.getElementById(
        "videoInput"
    );


/* =========================================================
   STATE
========================================================= */

let selectedUploadFile =
    null;

let selectedUploadType =
    null;

let selectedViewOnce =
    false;

let uploadBusy =
    false;

let previewObjectUrl =
    null;


/* =========================================================
   PREVIEW
========================================================= */

function createUploadPreview() {

    let preview =
        document.getElementById(
            "uploadPreviewOverlay"
        );


    if (preview)
        return preview;


    preview =
        document.createElement("div");

    preview.id =
        "uploadPreviewOverlay";


    Object.assign(
        preview.style,
        {
            position: "fixed",
            inset: "0",
            background: "rgba(0,0,0,.85)",
            zIndex: "99999",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box"
        }
    );


    preview.innerHTML = `

        <div
            id="uploadPreviewBox"
            style="
                width:100%;
                max-width:430px;
                max-height:90vh;
                overflow:auto;
                background:#15151b;
                border-radius:20px;
                padding:16px;
                box-sizing:border-box;
                color:white;
            "
        >

            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    margin-bottom:12px;
                "
            >

                <strong>
                    معاينة الملف
                </strong>

                <button
                    id="uploadPreviewClose"
                    type="button"
                    style="
                        border:0;
                        background:none;
                        color:white;
                        font-size:28px;
                        cursor:pointer;
                    "
                >
                    ×
                </button>

            </div>


            <div
                id="uploadPreviewMedia"
                style="
                    width:100%;
                    min-height:180px;
                    max-height:55vh;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    overflow:hidden;
                    border-radius:14px;
                    background:#09090c;
                    margin-bottom:14px;
                "
            ></div>


            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:10px;
                    padding:12px;
                    background:#202027;
                    border-radius:14px;
                    margin-bottom:12px;
                "
            >

                <div>

                    <div
                        style="
                            font-size:15px;
                            font-weight:bold;
                        "
                    >
                        مشاهدة مرة واحدة
                    </div>

                    <div
                        id="uploadViewOnceStatus"
                        style="
                            font-size:12px;
                            opacity:.7;
                            margin-top:3px;
                        "
                    >
                        غير مفعلة
                    </div>

                </div>


                <button
                    id="uploadViewOnceToggle"
                    type="button"
                    style="
                        width:58px;
                        height:34px;
                        border:0;
                        border-radius:20px;
                        background:#555;
                        color:white;
                        font-size:15px;
                        cursor:pointer;
                    "
                >
                    ①
                </button>

            </div>


            <div
                id="uploadProgressText"
                style="
                    display:none;
                    text-align:center;
                    font-size:13px;
                    opacity:.8;
                    margin-bottom:10px;
                "
            >
                جاري الرفع...
            </div>


            <div
                style="
                    display:flex;
                    gap:10px;
                "
            >

                <button
                    id="uploadCancelBtn"
                    type="button"
                    style="
                        flex:1;
                        border:0;
                        border-radius:14px;
                        padding:13px;
                        background:#303039;
                        color:white;
                        font-size:15px;
                    "
                >
                    إلغاء
                </button>


                <button
                    id="uploadSendBtn"
                    type="button"
                    style="
                        flex:1;
                        border:0;
                        border-radius:14px;
                        padding:13px;
                        background:#1877f2;
                        color:white;
                        font-size:15px;
                        font-weight:bold;
                    "
                >
                    إرسال
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        preview
    );


    document
        .getElementById("uploadPreviewClose")
        .addEventListener(
            "click",
            closeUploadPreview
        );


    document
        .getElementById("uploadCancelBtn")
        .addEventListener(
            "click",
            closeUploadPreview
        );


    document
        .getElementById("uploadViewOnceToggle")
        .addEventListener(
            "click",
            toggleViewOnce
        );


    document
        .getElementById("uploadSendBtn")
        .addEventListener(
            "click",
            sendSelectedUpload
        );


    preview.addEventListener(
        "click",
        function(event) {

            if (
                event.target === preview
            ) {

                closeUploadPreview();

            }

        }
    );


    return preview;
}


/* =========================================================
   ATTACHMENT BUTTON
========================================================= */

if (uploadAttachmentBtn) {

    uploadAttachmentBtn.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();


            if (
                !uploadAttachmentPanel
            )
                return;


            const isOpen =
                uploadAttachmentPanel.style.display !==
                "none";


            uploadAttachmentPanel.style.display =
                isOpen
                    ? "none"
                    : "flex";

        }
    );

}


/* =========================================================
   IMAGE OPTION
========================================================= */

if (uploadImageOption) {

    uploadImageOption.addEventListener(
        "click",
        function() {

            closeAttachmentPanel();


            if (!uploadImageInput)
                return;


            uploadImageInput.value =
                "";


            uploadImageInput.click();

        }
    );

}


/* =========================================================
   VIDEO OPTION
========================================================= */

if (uploadVideoOption) {

    uploadVideoOption.addEventListener(
        "click",
        function() {

            closeAttachmentPanel();


            if (!uploadVideoInput)
                return;


            uploadVideoInput.value =
                "";


            uploadVideoInput.click();

        }
    );

}


/* =========================================================
   IMAGE INPUT
========================================================= */

if (uploadImageInput) {

    uploadImageInput.addEventListener(
        "change",
        function() {

            const file =
                this.files &&
                this.files[0];


            if (!file)
                return;


            handleSelectedFile(
                file,
                "image"
            );


            this.value =
                "";

        }
    );

}


/* =========================================================
   VIDEO INPUT
========================================================= */

if (uploadVideoInput) {

    uploadVideoInput.addEventListener(
        "change",
        function() {

            const file =
                this.files &&
                this.files[0];


            if (!file)
                return;


            handleSelectedFile(
                file,
                "video"
            );


            this.value =
                "";

        }
    );

}


/* =========================================================
   HANDLE SELECTED FILE
========================================================= */

function handleSelectedFile(
    file,
    mediaType
) {

    if (uploadBusy)
        return;


    if (!file)
        return;


    if (
        mediaType === "image" &&
        !file.type.startsWith("image/")
    ) {

        showUploadMessage(
            "الملف المحدد ليس صورة."
        );

        return;
    }


    if (
        mediaType === "video" &&
        !file.type.startsWith("video/")
    ) {

        showUploadMessage(
            "الملف المحدد ليس فيديو."
        );

        return;
    }


    if (
        mediaType === "image" &&
        file.size > MAX_IMAGE_SIZE
    ) {

        showUploadMessage(
            "حجم الصورة أكبر من 15MB."
        );

        return;
    }


    if (
        mediaType === "video" &&
        file.size > MAX_VIDEO_SIZE
    ) {

        showUploadMessage(
            "حجم الفيديو أكبر من 100MB."
        );

        return;
    }


    selectedUploadFile =
        file;


    selectedUploadType =
        mediaType;


    selectedViewOnce =
        false;


    showUploadPreview(
        file,
        mediaType
    );
}


/* =========================================================
   SHOW PREVIEW
========================================================= */

function showUploadPreview(
    file,
    mediaType
) {

    const overlay =
        createUploadPreview();


    const media =
        document.getElementById(
            "uploadPreviewMedia"
        );


    if (!media)
        return;


    media.innerHTML =
        "";


    if (previewObjectUrl) {

        try {

            URL.revokeObjectURL(
                previewObjectUrl
            );

        } catch (_) {}

    }


    previewObjectUrl =
        URL.createObjectURL(
            file
        );


    if (
        mediaType === "image"
    ) {

        const img =
            document.createElement(
                "img"
            );


        img.src =
            previewObjectUrl;


        img.style.maxWidth =
            "100%";


        img.style.maxHeight =
            "55vh";


        img.style.objectFit =
            "contain";


        img.style.borderRadius =
            "10px";


        media.appendChild(
            img
        );

    } else {

        const video =
            document.createElement(
                "video"
            );


        video.src =
            previewObjectUrl;


        video.controls =
            true;


        video.playsInline =
            true;


        video.preload =
            "metadata";


        /* =================================================
           CHANGE ONLY:
           HIDE DOWNLOAD BUTTON IN VIDEO CONTROLS
           ================================================= */

        video.setAttribute(
            "controlsList",
            "nodownload"
        );


        video.style.maxWidth =
            "100%";


        video.style.maxHeight =
            "55vh";


        media.appendChild(
            video
        );
    }


    updateViewOnceUI();


    overlay.style.display =
        "flex";
}


/* =========================================================
   VIEW ONCE
========================================================= */

function toggleViewOnce() {

    selectedViewOnce =
        !selectedViewOnce;


    updateViewOnceUI();
}


function updateViewOnceUI() {

    const button =
        document.getElementById(
            "uploadViewOnceToggle"
        );


    const status =
        document.getElementById(
            "uploadViewOnceStatus"
        );


    if (!button)
        return;


    if (selectedViewOnce) {

        button.style.background =
            "#1877f2";


        button.textContent =
            "① ✓";


        if (status)
            status.textContent =
                "مفعلة — ستُفتح مرة واحدة";

    } else {

        button.style.background =
            "#555";


        button.textContent =
            "①";


        if (status)
            status.textContent =
                "غير مفعلة";
    }
}


/* =========================================================
   SEND UPLOAD
========================================================= */

async function sendSelectedUpload() {

    if (uploadBusy)
        return;


    if (!selectedUploadFile)
        return;


    uploadBusy =
        true;


    const sendButton =
        document.getElementById(
            "uploadSendBtn"
        );


    const progressText =
        document.getElementById(
            "uploadProgressText"
        );


    if (sendButton) {

        sendButton.disabled =
            true;


        sendButton.textContent =
            "جاري الرفع...";

    }


    if (progressText) {

        progressText.style.display =
            "block";


        progressText.textContent =
            "جاري رفع الملف إلى Cloudinary...";

    }


    try {

        /* =================================================
           FIREBASE AUTH
        ================================================= */

        if (
            typeof auth === "undefined" ||
            !auth ||
            !auth.currentUser
        ) {

            throw new Error(
                "USER_NOT_LOGGED_IN"
            );
        }


        const user =
            auth.currentUser;


        const file =
            selectedUploadFile;


        const mediaType =
            selectedUploadType;


        const viewOnce =
            selectedViewOnce === true;


        console.log(
            "FIREBASE USER:",
            user.uid
        );


        console.log(
            "CLOUDINARY FILE:",
            file.name
        );


        /* =================================================
           FILE NAME
        ================================================= */

        const safeOriginalName =
            sanitizeFileName(
                file.name
            );


        const uniqueName =
            Date.now() +
            "_" +
            randomString(20) +
            "_" +
            safeOriginalName;


        /* =================================================
           CLOUDINARY FORM DATA
        ================================================= */

        const formData =
            new FormData();


        formData.append(
            "file",
            file
        );


        formData.append(
            "upload_preset",
            CLOUDINARY_UPLOAD_PRESET
        );


        formData.append(
            "public_id",
            uniqueName
        );


        /*
         * نستخدم Firebase UID داخل الـ context
         * حتى نعرف صاحب الملف.
         */

        formData.append(
            "context",
            "firebase_uid=" +
            user.uid
        );


        /* =================================================
           UPLOAD TO CLOUDINARY
        ================================================= */

        const response =
            await fetch(
                CLOUDINARY_UPLOAD_URL,
                {
                    method: "POST",
                    body: formData
                }
            );


        console.log(
            "CLOUDINARY HTTP STATUS:",
            response.status
        );


        let result = null;


        try {

            result =
                await response.json();

        } catch (_) {

            result =
                null;
        }


        console.log(
            "CLOUDINARY RESPONSE:",
            result
        );


        if (!response.ok) {

            const cloudinaryError =
                result &&
                result.error &&
                result.error.message
                    ? result.error.message
                    : "CLOUDINARY_UPLOAD_FAILED";


            throw new Error(
                cloudinaryError
            );
        }


        if (!result) {

            throw new Error(
                "CLOUDINARY_EMPTY_RESPONSE"
            );
        }


        /* =================================================
           SECURE URL
        ================================================= */

        const publicUrl =
            result.secure_url ||
            result.url;


        if (!publicUrl) {

            throw new Error(
                "CLOUDINARY_URL_NOT_FOUND"
            );
        }


        console.log(
            "CLOUDINARY URL:",
            publicUrl
        );


        /* =================================================
           MEDIA DATA
        ================================================= */

        const mediaData = {

            type:
                mediaType,

            url:
                publicUrl,

            path:
                result.public_id ||
                uniqueName,

            fileName:
                file.name,

            mimeType:
                file.type,

            fileSize:
                file.size,

            viewOnce:
                viewOnce,

            opened:
                false,

            cloudinaryPublicId:
                result.public_id ||
                "",

            cloudinaryResourceType:
                result.resource_type ||
                "",

            cloudinaryFormat:
                result.format ||
                "",

            cloudinaryVersion:
                result.version ||
                null
        };


        /* =================================================
           CHAT.JS
        ================================================= */

        if (
            typeof window.addMediaMessage !==
            "function"
        ) {

            throw new Error(
                "CHAT_MEDIA_FUNCTION_NOT_FOUND"
            );
        }


        if (progressText) {

            progressText.textContent =
                "تم رفع الملف، جاري إرساله في الشات...";

        }


        showUploadMessage(
            "تم رفع الملف، جاري إرساله..."
        );


        await window.addMediaMessage(
            mediaData
        );


        console.log(
            "MEDIA MESSAGE SENT"
        );


        showUploadMessage(
            viewOnce
                ? "تم إرسال الملف للمشاهدة مرة واحدة ✓"
                : "تم إرسال الملف ✓"
        );


        closeUploadPreview();


    } catch (error) {

        console.error(
            "================================"
        );


        console.error(
            "CLOUDINARY UPLOAD FAILED:",
            error
        );


        console.error(
            "MESSAGE:",
            error &&
            error.message
        );


        console.error(
            "================================"
        );


        showUploadError(
            error
        );


    } finally {

        uploadBusy =
            false;


        if (sendButton) {

            sendButton.disabled =
                false;


            sendButton.textContent =
                "إرسال";
        }


        if (progressText) {

            progressText.style.display =
                "none";
        }
    }
}


/* =========================================================
   CLOSE PREVIEW
========================================================= */

function closeUploadPreview() {

    const overlay =
        document.getElementById(
            "uploadPreviewOverlay"
        );


    if (overlay) {

        overlay.style.display =
            "none";
    }


    const media =
        document.getElementById(
            "uploadPreviewMedia"
        );


    if (media) {

        const video =
            media.querySelector(
                "video"
            );


        if (video) {

            video.pause();


            video.removeAttribute(
                "src"
            );


            video.load();
        }


        media.innerHTML =
            "";
    }


    if (previewObjectUrl) {

        try {

            URL.revokeObjectURL(
                previewObjectUrl
            );

        } catch (_) {}


        previewObjectUrl =
            null;
    }


    selectedUploadFile =
        null;


    selectedUploadType =
        null;


    selectedViewOnce =
        false;
}


/* =========================================================
   CLOSE ATTACHMENT PANEL
========================================================= */

function closeAttachmentPanel() {

    if (
        uploadAttachmentPanel
    ) {

        uploadAttachmentPanel.style.display =
            "none";
    }
}


/* =========================================================
   SANITIZE
========================================================= */

function sanitizeFileName(
    name
) {

    let clean =
        String(
            name || "file"
        );


    clean =
        clean.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );


    if (
        clean.length > 100
    ) {

        clean =
            clean.substring(
                clean.length - 100
            );
    }


    return clean;
}


/* =========================================================
   RANDOM
========================================================= */

function randomString(
    length
) {

    const chars =
        "abcdefghijklmnopqrstuvwxyz0123456789";


    let result =
        "";


    for (
        let i = 0;
        i < length;
        i++
    ) {

        result +=
            chars.charAt(
                Math.floor(
                    Math.random() *
                    chars.length
                )
            );
    }


    return result;
}


/* =========================================================
   ERROR
========================================================= */

function showUploadError(
    error
) {

    let message =
        "تعذر رفع الملف.";


    if (!error) {

        showUploadMessage(
            message
        );

        return;
    }


    const errorMessage =
        String(
            error.message ||
            error.error_description ||
            error.msg ||
            ""
        );


    const lower =
        errorMessage.toLowerCase();


    if (
        errorMessage ===
        "USER_NOT_LOGGED_IN"
    ) {

        message =
            "يجب تسجيل الدخول أولاً.";
    }


    else if (
        errorMessage ===
        "CLOUDINARY_EMPTY_RESPONSE"
    ) {

        message =
            "Cloudinary لم يرجع بيانات الرفع.";
    }


    else if (
        errorMessage ===
        "CLOUDINARY_URL_NOT_FOUND"
    ) {

        message =
            "تم رفع الملف ولكن تعذر الحصول على الرابط.";
    }


    else if (
        errorMessage ===
        "CHAT_MEDIA_FUNCTION_NOT_FOUND"
    ) {

        message =
            "تم رفع الملف لكن CHAT.JS غير جاهز.";
    }


    else if (
        lower.includes(
            "upload preset"
        )
    ) {

        message =
            "Cloudinary رفض Upload Preset. تأكد أن chat_upload موجود وأنه Unsigned.";
    }


    else if (
        lower.includes(
            "invalid"
        ) &&
        lower.includes(
            "cloud"
        )
    ) {

        message =
            "بيانات Cloudinary غير صحيحة.";
    }


    else if (
        lower.includes(
            "file size"
        ) ||
        lower.includes(
            "too large"
        ) ||
        lower.includes(
            "maximum"
        )
    ) {

        message =
            "حجم الملف كبير جدًا.";
    }


    else if (
        lower.includes(
            "network"
        ) ||
        lower.includes(
            "failed to fetch"
        )
    ) {

        message =
            "حدثت مشكلة في الإنترنت أثناء الرفع.";
    }


    else if (
        errorMessage
    ) {

        message =
            "فشل الرفع: " +
            errorMessage;
    }


    showUploadMessage(
        message
    );
}


/* =========================================================
   TOAST
========================================================= */

function showUploadMessage(
    message
) {

    let toast =
        document.getElementById(
            "uploadToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "uploadToast";


        Object.assign(
            toast.style,
            {

                position:
                    "fixed",

                left:
                    "50%",

                bottom:
                    "90px",

                transform:
                    "translateX(-50%)",

                zIndex:
                    "100000",

                padding:
                    "10px 18px",

                borderRadius:
                    "14px",

                background:
                    "rgba(20,20,25,.96)",

                color:
                    "#fff",

                fontSize:
                    "14px",

                textAlign:
                    "center",

                maxWidth:
                    "90%",

                lineHeight:
                    "1.5",

                boxShadow:
                    "0 8px 30px rgba(0,0,0,.35)",

                direction:
                    "rtl"
            }
        );


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
            function() {

                toast.style.display =
                    "none";

            },
            5000
        );
}


/* =========================================================
   GLOBAL
========================================================= */

window.closeUploadPreview =
    closeUploadPreview;


/* =========================================================
   READY
========================================================= */

console.log(
    "CLOUDINARY UPLOAD.JS READY"
);