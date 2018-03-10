//A simple hashing algorithm. based on the Java hashCode function
String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++)
  {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};


//This function is ran if the user presses the button to log into the site
function loginClick()
{
  var username = document.getElementById("uName").value;
  var password = document.getElementById("pass").value;
  if(username == "" || password == "")
  {
    alert("Please ensure you have entered a username and a password");
  }
  else if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(username)))
  {
    alert("Email is not in the correct format!");
  }
  else
  {
    var hash = new XMLHttpRequest();
    hash.onreadystatechange = function(response)
    {
      if (hash.readyState == 4 && hash.status == 200)
      {
        //The salt is received from the server and used to hash the password
        var saltedPass = password + JSON.parse(this.responseText)["payload"]["salt"];
        var hashedPass = saltedPass.hashCode();
        //The hashed password and email are sent to the login HTTP request
        localStorage.setItem("userType", "student");
        getTimetable.open("POST", "https://medtracker-hackmed-api.herokuapp.com/login", true);
        getTimetable.setRequestHeader("Cache-Control", "no-cache");
        getTimetable.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        getTimetable.send("email="+username+"&password="+hashedPass);
      }
    }
    //Sends email to server, receives back salt
    hash.open("POST", "https:/medtracker-hackmed-api.herokuapp.com/salt", true);
    hash.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    hash.setRequestHeader("Cache-Control", "no-cache");
    hash.send("email="+username);
  }
}

//This function is ran if the user tries to sign up to the site
function signupClick()
{
  var emailSignup = document.getElementById("sEmail").value;
  var sPass = document.getElementById("sPass").value;
  var signUpTG = document.getElementById("sPhoneNumber").value;
  if(emailSignup == "" || sPass == "" || sPassCon == "" || sPhoneNumber == "")
  {
    alert("Please ensure you have entered all the information");
  }
  else if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailSignup)))
  {
    alert("Email is not in the correct format!");
  }
  else if (sPass.length < 8)
  {
    alert("Password must be at least 8 characters long!");
  }
  else if (sPass != document.getElementById("sPassCon").value)
  {
    alert("Password and confirmation don't match!");
  }
  else
  {
    var regHash = new XMLHttpRequest();
    regHash.onreadystatechange = function(response)
    {
      if (regHash.readyState == 4 && regHash.status == 200)
      {
        var regSaltedPass = sPass + JSON.parse(this.responseText)["payload"]["salt"];
        var regHashedPass = regSaltedPass.hashCode();
        var register = new XMLHttpRequest();
        register.onreadystatechange = function()
        {
          if (register.readyState == 4 && register.status == 200)
          {
            var registerResponse = JSON.parse(this.responseText);
            if(registerResponse["error"] == true)
            {
              alert(registerResponse["message"]);
            }
            else
            {
              alert("User registered successfully - please login")
            }
          }
        }
        //Sends user's data to the server, replies as to if they are registered
        register.open("POST","https://medtracker-hackmed-api.herokuapp.com/register", true);
        register.setRequestHeader("Cache-Control", "no-cache");
        register.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        register.send("email="+emailSignup+"&password="+regHashedPass+"&phoneNumber="+sPhoneNumber);
      }
    }
    //Sends email to server and receives back salt
    regHash.open("POST", "https://medtracker-hackmed-api.herokuapp.com/salt", true);
    regHash.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    regHash.setRequestHeader("Cache-Control", "no-cache");
    regHash.send("email="+emailSignup);
  }
}


function resetClick()
{
  var resetEmail = document.getElementById(rEmail);
  var resetPassword = new XMLHttpRequest();
  resetPassword.onreadystatechange = function()
  {
    if (resetPassword.readyState == 4 && resetPassword.status == 200)
    {
      var resetResponse = JSON.parse(this.responseText);
      if(resetResponse["error"] == true)
      {
        alert(resetResponse["message"]);
      }
      else
      {
        alert(resetResponse["payload"]);
      }
    }
  }
  resetPassword.open("POST", "https://medtracker-hackmed-api.herokuapp.com/resetPassword" , true);
  resetPassword.setRequestHeader("Cache-Control", "no-cache");
  resetPassword.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  resetPassword.send("email="+resetEmail);
}
