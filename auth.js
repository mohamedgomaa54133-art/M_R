/* =========================================================
   AUTH.JS
   START OF FILE
========================================================= */


/* =========================================================
   START — LOGIN SYSTEM
========================================================= */

const loginForm = document.getElementById("loginForm");

const loginBtn = document.getElementById("loginBtn");

const loginMessage = document.getElementById("loginMessage");


loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    loginMessage.style.color = "#ffffff";

    loginMessage.textContent =
        "جاري التحقق...";

    loginBtn.disabled = true;


    try {

        const userCredential =
            await auth.signInWithEmailAndPassword(
                email,
                password
            );


        console.log(
            "LOGIN SUCCESS:",
            userCredential.user.uid
        );


        loginMessage.style.color = "#ffffff";

        loginMessage.textContent =
            "تم تسجيل الدخول بنجاح ✓";


        /*
         * ننتظر قليلًا حتى نتأكد
         * أن عملية الدخول انتهت بالكامل.
         */

        setTimeout(function () {

            window.location.assign("profile.html");

        }, 1000);


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        loginMessage.style.color = "#ff6868";


        if (
            error.code ===
            "auth/invalid-credential"
        ) {

            loginMessage.textContent =
                "البريد الإلكتروني أو كلمة المرور غير صحيحة";

        }

        else if (
            error.code ===
            "auth/invalid-email"
        ) {

            loginMessage.textContent =
                "البريد الإلكتروني غير صحيح";

        }

        else if (
            error.code ===
            "auth/too-many-requests"
        ) {

            loginMessage.textContent =
                "محاولات كثيرة، حاول لاحقًا";

        }

        else {

            loginMessage.textContent =
                "خطأ: " + error.message;

        }


        loginBtn.disabled = false;

    }

});


/* =========================================================
   END — LOGIN SYSTEM
========================================================= */


/* =========================================================
   AUTH.JS
   END OF FILE
========================================================= */