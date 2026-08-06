let flagRedaman = false;
let flagSpeed = false;
let flagcontinue = false;
let okRedaman = false;
let okSpeed = false;
let loadRedaman;
let loadSpeed;
let timerWait0;
let timerWait1;
let timerWait2;
let timerWait3;
let timerWait4;
let timerWait5;
let timerWait6;
let timerWait7;
let checkreport;
let uid_task;
let timeoutspeed;
let timeoutEnabledBtnSpeed;
let device;
let speedMandatory;

var packageName = null;
var spt;
var rest;
var spd;
var VarSpeed;
var detailAccess = null;
var nd_number = null;
var successCheck = 0;
let ip_addr = null;
let res_myip = {};
let myip_statusCode = null;
var ticket = null;
var url_module = "Check_embededv1";

let speedName = "dbt";

$(function () {
  document.title = "Docking";
  detailAccess = window.navigator.userAgentData ? JSON.stringify(window.navigator.userAgentData) : null;
  
  if (window.addEventListener) {
    window.addEventListener("message", ooklaListener);
  } else if (window.attachEvent) {
    window.attachEvent("onmessage", ooklaListener);
  }

  $("#select-serverId").change(function (e) {
    e.preventDefault();
    if (speedName == "ookla") {
      if ($("#select-serverId").val()) {
        reloadOokla();
      } else {
        $("#ookla").attr("src", `http://test-inf-1.speedtestcustom.com`);
      }
    }
  });

  $("#submit-ticket").click(function (e) {
    e.preventDefault();
    $("#input-ticket").val($("#input-ticket").val().toUpperCase());
    // doTask();
    if ($("#input-ticket").val() != "") {
      if ($("#input-nd").val() != "") {
        doTask();
      } else {
        $("#error-nd-null").modal("show");
      }
    } else {
      $("#error-ticket").modal("show");
      $("#error-submit-ticket").removeClass("invisible");
    }
  });

  $("#submit-wait").click(function (e) {
    $("#error-nd").modal("hide");
  });
  $("#submit-wait-null").click(function (e) {
    $("#error-nd-null").modal("hide");
  });
  $("#submit-wait-error").click(function (e) {
    $("#error-ticket").modal("hide");
  });
  $("#input-ticket").focus(function () {
    $("#error-submit-ticket").addClass("invisible");
  });
  $("#retry, #retry-2").click(function (e) {
    e.preventDefault();
    window.location.href = window.location.href;
  });

  $("#submit-close-y").click(function (e) {
    // e.preventDefault();
    // sendClose(1);
    $("#show-confirm").addClass("hide");
    $("#show-eligible-close-y").addClass("hide");
    $("#show-eligible").removeClass("hide");
    $("#show-eligible-thanks").removeClass("hide");
  });
  $("#submit-close-n").click(function (e) {
    // e.preventDefault();
    // sendClose(0);
  });
  $("#submit-wait-0-y").click(function (e) {
    e.preventDefault();
    $("#ask-wait-0").modal("hide");
  });
  $("#submit-wait-0-n").click(function (e) {
    e.preventDefault();
    $("#ask-wait-0").modal("hide");
    window.location.href = window.location.href;
  });

  $("#submit-wait-1-n").click(function (e) {
    e.preventDefault();
    $("#ask-wait-1").modal("hide");
    window.location.href = window.location.href;
  });
  $("#submit-wait-2-y").click(function (e) {
    e.preventDefault();
    $("#ask-wait-2").modal("hide");
  });
  $("#btnhelp-home").click(function (e) {
    $("#ask-wait-2").modal("show"); //show-help-home
  });
  $("#submit-wait-2-n").click(function (e) {
    e.preventDefault();
    $("#ask-wait-2").modal("hide");
    window.location.href = window.location.href;
  });
  $("#submit-speed").click(function (e) {
    let runspeedtest = null;
    if (rest) {
      if (rest.download) {
        runspeedtest = "ookla";
      } else {
        runspeedtest = "dbt";
      }
    } else {
      runspeedtest = "failed";
    }
    var datas = {
      speed: JSON.stringify(rest),
      // uid: $("#uid").html(), //document.getElementById("uid").innerHTML,
      uid: uid_task,
      speedtestname: runspeedtest,
    };
    $("#loader-redaman").addClass("hide");
    $("#submit-speed").addClass("disabled");
    e.preventDefault();
    $.ajax({
      method: "post",
      dataType: "json",
      url: site_url(url_module + "/SaveSpeed"),
      contentType: "application/json",
      data: JSON.stringify(datas),
      async: false,
      tryCount: 0,
      retryLimit: 3,
      success: function (response) {
        //matikan timeout tombol continue active
        clearTimeout(timeoutEnabledBtnSpeed);
        //matikan timeout untuk trigger click auto tombol continue speedtest
        clearTimeout(timerWait6);
        // tutup modal speedtest
        $("#ookla-test").modal("hide");
        $("#loader-speed").addClass("hide");

        //jika gagal munculkan wording failed
        if (!response.success) {
          $("#message-failed").html("failed, Silahkan lakukan ulang.");
          finish("failed");
          return;
        }

        flagSpeed = true;
        retrievepassed(1);
      },
      error: function (err) {
        if (err.status != 200) {
          this.tryCount++;
          if (this.tryCount <= this.retryLimit) {
            //try again
            $.ajax(this);
            return;
          }
        }
        $("#message-failed").html("failed, Silahkan lakukan ulang.");
        finish("failed");
      },
    });
    // }
  });
});

// '{"success":true,"data":[{"ip":"36.94.47.59","dl":32080,"ul":12110,"ping":11.9,"jitter":2.25,"serverId":"e425a2ca-ab2e-44f1-b505-a3f26ee17630","serverName":"Jakarta","host":"https://jakarta.speedtest.telkom.net.id.prod.hosts.ooklaserver.net:8080/","distance":0.39408023009236404,"odp_distance":2048,"start_time":"2022-12-29T09:23:45.107Z","end_time":"2022-12-29T09:24:05.319Z","test_id":"8881746a-6f4c-49be-957f-1e4b425a4ca2","nd":"122302257390","userId":"unique user id","lat":-6.5971469,"long":106.8060388,"units":"Kbps"}]}',//

//tombol reload iframe speedtes
var count = 0;
function reloadOokla() {
  count++;

  console.log(speedName);
  if (speedName == "ookla") {
    let serverId = $("#select-serverId").val();
    let serverDst = null;
    if ($("#select-serverId").val()) {
      switch (serverId) {
        case "45466":
          serverDst = "45466";
          break;
        case "37343":
          serverDst = "37343";
          break;
        case "45462":
          serverDst = "45462";
          break;
        case "45463":
          serverDst = "45463";
          break;
        case "37344":
          serverDst = "37344";
          break;
        case "45464":
          serverDst = "45464";
          break;
        case "45465":
          serverDst = "45465";
      }

      $("#ookla").attr(
        "src",
        `http://test-inf-1.speedtestcustom.com?serverId=${serverDst}`
      );
    } else {
      $("#ookla").attr("src", $("#ookla").attr("src"));
    }
  } else {
    $('select option[value=""]').attr("selected", true);
    $("#ookla").attr("src", $("#ookla").attr("src"));
  }

  // $('#ookla').attr("src", $('#ookla').attr("src"));
  $("#submit-speed").removeClass("enabled");
  $("#submit-speed").addClass("disabled");

  console.log(count);
  if (count > 5) {
    document.getElementById("btn").disabled = true;
    $("#select-serverId").addClass("hide");
    $("#label-option").addClass("hide");
    $(".refresh-btn").addClass("disabled");
    $(".refresh-btn").addClass("hide");
    $(".fa-refresh").addClass("hide");
    $("#submit-speed").addClass("disabled");
    // alert("You can only click this button 3 times !!!");
  }
}

//listener proses speedtest
function ooklaListener(ev) {
  console.log(ev);
  if (typeof ev == "undefined" && flagcontinue == true) {
    // return doOokla(); // $('#ookla').attr("src", $('#ookla').attr("src"));
    // clearInterval(timeoutspeed)
  }

  spt = ev.data;
  if (spt.download) {
    if (flagcontinue == true) {
      if (VarSpeed == 1) {
        $("#select-serverId").addClass("hide");
        $("#label-option").addClass("hide");
        $(".fa-refresh").addClass("hide");
        $(".refresh-btn").addClass("hide");
        console.log("ookla");
        rest = spt;
        $("#text-complete").removeClass("hide");
        $("#submit-speed").removeClass("disabled");
        $("#submit-speed").addClass("enabled");
        timerWait6 = setTimeout(function () {
          $("#submit-speed").trigger("click");
        }, 7000);
      }
    } else {
      checkreport = setInterval(function () {
        if (flagcontinue == true) {
          if (VarSpeed == 1) {
            $("#select-serverId").addClass("hide");
            $("#label-option").addClass("hide");
            $(".fa-refresh").addClass("hide");
            $(".refresh-btn").addClass("hide");
            rest = spt;
            $("#text-complete").removeClass("hide");
            $("#submit-speed").removeClass("disabled");
            $("#submit-speed").addClass("enabled");
            timerWait6 = setTimeout(function () {
              $("#submit-speed").trigger("click");
            }, 5000);
          }
          clearInterval(checkreport);
        }
      }, 5000);
    }
  } else {
    if (spt.success == false) {
      // doOokla();
    } else {
      if (flagcontinue == true) {
        if (VarSpeed == 0) {
          $("#select-serverId").addClass("hide");
          $("#label-option").addClass("hide");
          $(".fa-refresh").addClass("hide");
          $(".refresh-btn").addClass("hide");
          rest = spt;
          $("#text-complete").removeClass("hide");
          $("#submit-speed").removeClass("disabled");
          $("#submit-speed").addClass("enabled");
          timerWait6 = setTimeout(function () {
            $("#submit-speed").trigger("click");
          }, 7000);
        }
      } else {
        checkreport = setInterval(function () {
          if (flagcontinue == true) {
            if (VarSpeed == 0) {
              $("#select-serverId").addClass("hide");
              $("#label-option").addClass("hide");
              $(".fa-refresh").addClass("hide");
              $(".refresh-btn").addClass("hide");
              rest = spt;
              $("#text-complete").removeClass("hide");
              $("#submit-speed").removeClass("disabled");
              $("#submit-speed").addClass("enabled");
              timerWait6 = setTimeout(function () {
                $("#submit-speed").trigger("click");
              }, 5000);
            }
            clearInterval(checkreport);
          }
        }, 5000);
      }
    }
  }
}

// funtion submit ticket
function doTask() {
  //deteksi pengguna menggunakan HP atau PC/Laptop
  //HP device == true
  //PC device == false
  device = typeof navigator.userAgentData != 'undefined' ? navigator.userAgentData.mobile ? true : false : null;
  $("#input-ticket").attr("disabled", "disabled");
  $("#submit-ticket").addClass("hide");
  $("#loader-ticket").removeClass("hide");
  ticket = $("#input-ticket").val().toUpperCase();
  $.ajax({
    method: "post",
    dataType: "json",
    url: site_url(url_module + "/createTask"),
    async: true,
    tryCount: 0,
    retryLimit: 3,
    timeout: 60000,
    data: {
      ticket: $("#input-ticket").val(),
      nd: $("#input-nd").val(),
      detailAccess: detailAccess,
      device: device,
    },
    success: function (response) {
      if (response.success) {
        $("#uid").html(response.data.uid);
        $("#uidookla").html(response.data.uid);
        $("#uidooklaa").html(response.data.uid);
        timerWait0 = setTimeout(function () {
          $("#ask-ticket").addClass("hide");
          $("#show-check").addClass("hide");
          $("#message-failed").html("Tidak mendapatkan Authentikasi");
          finish("failed");
        }, 60000);

        nd_number = $("#input-nd").val();
        uid_task = response.data.uid;
        doToken1();

        //aktifkan tombol continue pada modal ookla setelah 3 menit tumbol submit ticket di klik
        // 180000 ms == 3 menit
        timeoutEnabledBtnSpeed = setTimeout(function () {
          $("#submit-speed").removeClass("disabled");
          $("#submit-speed").addClass("enabled");
        }, 180000);
        //--------------------------------------------------------------------------------------------//
      } else {
        alert(
          "Pastikan no Ticket gangguan anda sudah benar di inputkan, dan lakukan kembali QC SCC."
        );
        $("#message-failed").html(
          "Pastikan no Ticket gangguan anda sudah benar di inputkan, dan lakukan kembali QC SCC."
        );
        finish("failed");
      }
    },
    error: function (err) {
      if (err.status != 200) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          //try again
          $.ajax(this);
          return;
        }
      }
      // $('#show-finish').removeClass('hide');
      $("#message-failed").html("*failed, Silahkan lakukan ulang.");
      finish("failed");
    },
  });
}

//request token APIGW
function doToken1() {
  $.ajax({
    method: "post",
    dataType: "json",
    url: site_url(url_module + "/retrieveToken1"),
    async: true,
    tryCount: 0,
    retryLimit: 3,
    timeout: 60000,
    data: {
      // uid: $("#uid").html(),
      uid: uid_task,
    },
    success: function (response) {
      //matikan timeout cek autentikasi
      clearTimeout(timerWait0);
      // jika gagal mendapatkan autentikasi maka berikan wording gagal
      if (!response.success) {
        $("#ask-ticket").addClass("hide");
        $("#show-finish").removeClass("hide");
        $("#message-failed").html(
          "Gagal mendapatkan Authentikasi, silahkan lakukan QC SCC secara berkala"
        );
        finish("failed");
        return;
      }

      timerWait1 = setTimeout(function () {
        $("#show-check").addClass("hide");
        $("#show-finish-ndins").removeClass("hide");
        $("#ask-ticket").addClass("hide");
      }, 60000);

      doNDByIN();
    },
    error: function (err, t) {
      if (err.status != 200) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          //try again
          $.ajax(this);
          return;
        }
      }

      if (t == "timeout") {
        $("#ask-ticket").addClass("hide");
        $("#show-finish").removeClass("hide");
        $("#message-failed").html(
          "Gagal mendapatkan Authentikasi, silahkan lakukan QC SCC secara berkala"
        );
        finish("failed");
        return;
      }

      clearTimeout(timerWait0);
      $("#message-failed").html("**failed, Silahkan lakukan ulang.");
      finish("failed");
    },
  });
}

function doNDByIN() {
  // Periksa apakah ticket dimulai dengan "INC"
  if (ticket.substr(0, 2) === "IN") {
    // Jalankan AJAX untuk ticket yang dimulai dengan "INC"
    $.ajax({
      method: "post",
      dataType: "json",
      url: site_url(url_module + "/retrieveNDByIN"),
      async: true,
      tryCount: 0,
      retryLimit: 3,
      timeout: 60000,
      data: {
        // uid: $("#uid").html(),
        uid: uid_task,
      },
      success: function (response) {
        // Matikan timeout cek service number
        clearTimeout(timerWait1);

        // Cek status code http
        // Jika status bukan 200, tampilkan pesan kesalahan yang sesuai
        if (response.status != 200) {
          if (ticket.substr(0, 3) != "INC") {
            $("#show-finish-nds").removeClass("hide");
          } else {
            $("#show-finish-ndins").removeClass("hide");
          }
          $("#ask-ticket").addClass("hide");
          $("#show-check").addClass("hide");
          return;
        }

        // Cek status failed
        // Jika failed, tampilkan pesan gagal yang sesuai
        if (!response.success) {
          if (ticket.substr(0, 3) != "INC") {
            $("#show-finish-nds").removeClass("hide");
          } else {
            $("#show-finish-ndins").removeClass("hide");
          }
          $("#ask-ticket").addClass("hide");
          $("#show-check").addClass("hide");
          return;
        }

        // Jika service number tidak ada/null, tampilkan pesan gagal yang sesuai
        if (response.data.witel == null) {
          $("#show-finish-witel").removeClass("hide");
          $("#ask-ticket").addClass("hide");
          $("#show-check").addClass("hide");
          return;
        }

        // Set timeout untuk cek informasi paket
        timerWait2 = setTimeout(function () {
          $("#show-finish-pcrf").removeClass("hide");
          $("#show-check").addClass("hide");
          $("#ask-ticket").addClass("hide");
        }, 60000);

        // Panggil fungsi cek detail paket
        check_package();
      },
      error: function (err, t) {
        if (err.status != 200) {
          this.tryCount++;
          if (this.tryCount <= this.retryLimit) {
            // Coba lagi
            $.ajax(this);
            return;
          }
        }

        if (t == "timeout") {
          if (ticket.substr(0, 3) != "INC") {
            $("#show-finish-nds").removeClass("hide");
          } else {
            $("#show-finish-ndins").removeClass("hide");
          }
          $("#ask-ticket").addClass("hide");
          $("#show-check").addClass("hide");
          return;
        }

        // Tampilkan pesan kesalahan umum jika gagal
        $("#message-failed").html("failed, Silahkan lakukan ulang..");
        finish("failed");
      },
    });
  } else {
    // Jalankan check_package() untuk ticket yang tidak dimulai dengan "INC"
    clearTimeout(timerWait1);

    timerWait2 = setTimeout(function () {
      $("#show-finish-pcrf").removeClass("hide");
      $("#show-check").addClass("hide");
      $("#ask-ticket").addClass("hide");
    }, 60000);

    check_package();
  }
}

//check paket dan penentuan speedtest
function check_package() {
  $.ajax({
    method: "post",
    dataType: "json",
    url: site_url(url_module + "/retrieveUPCF"),
    async: true,
    tryCount: 0,
    retryLimit: 3,
    timeout: 60000,
    data: {
      // uid: $("#uid").html(),
      uid: uid_task,
    },
    success: function (response) {
      //matikan fungsi timeout cek pcrf
      clearTimeout(timerWait2);

      //jika http code tidak sama dengan 200 maka munculkan wording gagal
      if (response.data.statusCode != 200) {
        $("#show-finish-pcrf").removeClass("hide");
        $("#show-check").addClass("hide");
        $("#ask-ticket").addClass("hide");
        return;
      }

      //jika gagal dapat output dari pcrf maka munculkan wording gagal
      if (!response.success) {
        $("#show-finish-pcrf").removeClass("hide");
        $("#show-check").addClass("hide");
        $("#ask-ticket").addClass("hide");
        return;
      }

      // inisiasi nama paket dan speedtest mandatory
      packageName = response.data.package_name;
      speedMandatory = response.data.mandatorySpeed;

      //lakukan timeout 1 menit, jika tidak mendapat response dalam 1 menit
      //tampilkan wording gagal dapat output dari radius
      timerWait3 = setTimeout(function () {
        $("#message-failed-radius").html(
          "Tidak ditemukan output dari GetIP Radius, silahkan lakukan ulang QC SCC secara berkala."
        );
        $("#show-finish-ipradius").removeClass("hide");
        $("#ask-ticket").addClass("hide");
        $("#show-check").addClass("hide");
      }, 60000);

      //check jika isolir / not mandatory
      //jika status isolir / not mandatory speedtest maka speedtest tdk di lakukan
      if (
        response.data.package_name === "ISOLIRAN" ||
        response.data.package_name === "INETBHOME" ||
        response.data.mandatorySpeed === 0
      ) {
        getLocationUser();
        setTimeout(function () {
          doIPRadius();
        }, 6000);
        return;
      }

      //mapping speedtest
      // jika data speedtest = 0 maka panggil function utk melakukan speedtest DBT
      if (response.data.speedtest == 0) {
        VarSpeed = response.data.speedtest;
        doSpeedtestDBT();
        doIPRadius();
        return;
      }
      //maka selain itu jalankan speedtest ookla
      doOokla();
      doIPRadius();
    },
    error: function (err, t) {
      if (err.status != 200) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          //try again
          $.ajax(this);
          return;
        }
      }

      if (t == "timeout") {
        $("#show-finish-pcrf").removeClass("hide");
        $("#show-check").addClass("hide");
        $("#ask-ticket").addClass("hide");
        return;
      }

      $("#show-finish-pcrf").removeClass("hide");
      $("#show-check").addClass("hide");
      $("#ask-ticket").addClass("hide");
    },
  });
}

//Cek IP pelanggan
function doIPRadius() {
  //$('#loader-redaman').removeClass('hide');
  $.ajax({
    method: "post",
    dataType: "json",
    url: site_url(url_module + "/retrieveIPRadius"),
    async: true,
    tryCount: 0,
    retryLimit: 3,
    timeout: 60000,
    data: {
      // uid: $("#uid").html(), //document.getElementById("uid").innerHTML,
      uid: uid_task,
    },
    success: function (response) {
      clearTimeout(timerWait3);

      //jika code http dari api tidak sama dengan 200
      //maka munculkan wording gagal
      if (response.data.statusCode != 200) {
        clearTimeout(timerWait3);
        $("#ask-ticket").addClass("hide");
        $("#show-check").addClass("hide");
        $("#show-finish-ipradius").removeClass("hide");
        $("#message-failed-radius").html(
          "Tidak ditemukan output dari GetIP Radius"
        );
        return;
      }

      //jika gagal mendaptakan output
      //maka munculkan wording gagal
      if (!response.success) {
        $("#message-failed-radius").html(
          "Tidak ditemukan IP dari nomor internet Anda di Radius."
        );
        $("#show-finish-ipradius").removeClass("hide");
        $("#ask-ticket").addClass("hide");
        $("#show-check").addClass("hide");
        return;
      }

      //jika ip tidak tidak ada maka munculkan wording gagal
      // if (response.data.frame_ip == null) {
      //   $("#message-failed-radius").html(
      //     "Tidak ditemukan IP dari nomor internet Anda di Radius."
      //   );
      //   $("#show-finish-ipradius").removeClass("hide");
      //   $("#ask-ticket").addClass("hide");
      //   $("#show-check").addClass("hide");
      //   return;
      // }

      //set timeout untuk cek ip modem/ont
      //jika dalam 1 menit tidak berhasil cek ip maka munculkan wording gagal
      timerWait4 = setTimeout(function () {
        $("#message-failed-myip").html(`<b>Failed MyIP IndiHome</b>
              <br>
              IP IndiHome anda tidak terderteksi, silahkan <a href="https://myip.tacc.id" target="_blank" style="background-color: #ffffff; color: black; padding: 4px 8px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">klik disini</a> untuk melihat IP IndiHome anda, jika berhasil di akses dan IP terdeteksi silahkan lakukan ulang QC internet IndiHome Anda.
              <hr />`);
        $("#show-finish-myip").removeClass("hide");
        $("#show-check").addClass("hide");
        $("#ask-ticket").addClass("hide");
      }, 60000);

      //panggil fungsi cek ip ont/modem
      doWho();
    },
    error: function (err, t) {
      if (err.status != 200) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          //try again
          $.ajax(this);
          return;
        }
      }

      if (t == "timeout") {
        $("#ask-ticket").addClass("hide");
        $("#show-check").addClass("hide");
        $("#show-finish-ipradius").removeClass("hide");
        $("#message-failed-radius").html(
          "Tidak ditemukan output dari GetIP Radius."
        );
        return;
      }
      clearTimeout(timerWait3);
      $("#ask-ticket").addClass("hide");
      $("#show-check").addClass("hide");
      $("#show-finish-ipradius").removeClass("hide");
      $("#message-failed-radius").html(
        "Tidak ditemukan output dari GetIP Radius."
      );
    },
  });
}

//get IP ont from device user
function doWho() {
  $.ajax({
    method: "get",
    dataType: "json",
    url: "https://myip.tacc.id",
    async: true,
    tryCount: 0,
    retryLimit: 5,
    timeout: 60000,
    //url: 'https://test.indihome.co.id/CloseTicket.Internet/Test/myip/4',
    success: function (response, text, xhr) {
      myip_statusCode = xhr.status ? xhr.status : null;
      //matikan timeout radius
      clearTimeout(timerWait4);
      // jika gagal maka munculkan wording gagal
      if (typeof response.ip_addr == "undefined") {
        this.tryCount++;
        //loping 5x untuk cek ip modem
        if (this.tryCount <= this.retryLimit) {
          //try again
          $.ajax(this);
          return;
        }

        //jika lebih dari 5x gagal maka munculkan wording failed
        $("#show-finish-myip").removeClass("hide");
        $("#ask-ticket").addClass("hide");
        $("#message-failed-myip").html(`<b>Failed MyIP IndiHome</b>
				<br>
				IP IndiHome anda tidak terderteksi, silahkan <a href="https://myip.tacc.id" target="_blank" style="background-color: #ffffff; color: black; padding: 4px 8px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">klik disini</a> untuk melihat IP IndiHome anda, jika berhasil di akses dan IP terdeteksi silahkan lakukan ulang QC internet IndiHome Anda.
				<hr />`);
        alert(`${xhr.responseText} please test https://myip.tacc.id`);
        return;
      }

      // inisiasi ip modem
      ip_addr = response.ip_addr ? response.ip_addr : null;
      successCheck = response.ip_addr ? 1 : 0;
      res_myip = response ? JSON.stringify(response) : null;
      saveMyIP();
    },
    error: function (a, b, c) {
      console.log(a);
      if (a.status != 200) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          //try again
          $.ajax(this);
          return;
        }
      }
      $("#show-finish-myip").removeClass("hide");
      $("#ask-ticket").addClass("hide");
      $("#message-failed-myip").html(`<b>Failed MyIP IndiHome</b>
			<br>
			IP IndiHome anda tidak terderteksi, silahkan <a href="https://myip.tacc.id" target="_blank" style="background-color: #ffffff; color: black; padding: 4px 8px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">klik disini</a> untuk melihat IP IndiHome anda, jika berhasil di akses dan IP terdeteksi silahkan lakukan ulang QC internet IndiHome Anda.
			<hr />`);
      alert(`${a.statusText} please test https://myip.tacc.id`);
      clearTimeout(timerWait4);
    },
  });
}

function saveMyIP() {
  $.ajax({
    method: "post",
    dataType: "json",
    url: site_url(url_module + "/saveWho"),
    async: true,
    tryCount: 0,
    retryLimit: 3,
    timeout: 60000,
    data: {
      // uid: $("#uid").html(),
      uid: uid_task,
      ip_addr: ip_addr,
      success: successCheck,
      request: null,
      response: res_myip,
      statusCode: myip_statusCode,
    },
    success: function (response1) {
      // jika gagal maka munculkan wording failed
      if (!response1.success) {
        $("#message-failed-myip").html(`<b>Failed MyIP IndiHome</b>
        <br>
        IP IndiHome anda tidak terderteksi, silahkan <a href="https://myip.tacc.id" target="_blank" style="background-color: #ffffff; color: black; padding: 4px 8px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">klik disini</a> untuk melihat IP IndiHome anda, jika berhasil di akses dan IP terdeteksi silahkan lakukan ulang QC internet IndiHome Anda.
        <hr />`);
        $("#show-finish-myip").removeClass("hide");
        $("#ask-ticket").addClass("hide");
        $("#show-check").addClass("hide");
        return;
      }
      if (response1.data.passed_ip) {
        //munculkan halaman pengujian dan hilangkan hamalam input ticket gangguan
        $("#ask-wait-0").modal("hide");
        $("#ask-ticket").addClass("hide");
        $("#show-check").removeClass("hide");

        // isi kolom nomor tiket dengan output dari ajax ini
        $("#confirm-ticket").val(response1.data.ticket);
        // isi kolom nomor Internet Anda dengan output dari ajax ini
        $("#confirm-nd").val(response1.data.nd);
        // tampilkan waktu pertama kali saat tiket di submit dalam waktu WIB
        $("#confirm-ts").text(response1.data.ts + " WIB");
        // munculkan loader speedtest pada kolom Kecepatan Internet
        $("#loader-speed").removeClass("hide");
        // munculkan loader jarak odp pada kolom Jarak ODP
        $("#loader-distance-odp").removeClass("hide");
        // munculkan loader latlong pada kolong LatLong
        $("#loader-longlat").removeClass("hide");
        // munculkan loader nama odp pada kolong nama odp
        $("#loader-odp-name").removeClass("hide");

        // set timeout utk cek redaman
        // jika dalam 1 menit tidak mendapatkan output maka munculkan wording gagal
        timerWait5 = setTimeout(function () {
          $("#show-finish-rdm").removeClass("hide");
          $("#ask-ticket").addClass("hide");
          $("#show-check").addClass("hide");
        }, 60000);

        // panggil fungsi utk cek kecepatan speedtest ONT/Modem
        doSpeedAcsis();
        // panggil fungsi utk cek kualitas jaringan/redaman
        doRedaman();
        return;
      } else {
        // jika ip passed = 0 (di anggap tidak di rumah pelanggan)
        // munculkan wording tidak bisa melanjutkan pengujian
        $("#show-finish-ip").removeClass("hide");
        $("#ask-ticket").addClass("hide");
        $("#show-check").addClass("hide");
        return;
      }
    },
    error: function (a) {
      clearTimeout(timerWait4);
      if (a.status != 200) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          //try again
          $.ajax(this);
          return;
        }
      }

      $("#message-failed").html("***failed, Silahkan lakukan ulang.");
      finish("failed");

      // $('#show-finish-myip').removeClass('hide');
      // $('#ask-ticket').addClass('hide');
      // $('#message-failed-myip').html(`<b>Failed MyIP IndiHome</b>
      // <br>
      // IP IndiHome anda tidak terderteksi, silahkan <a href="https://myip.tacc.id" target="_blank" style="background-color: #ffffff; color: black; padding: 4px 8px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">klik disini</a> untuk melihat IP IndiHome anda, jika berhasil di akses dan IP terdeteksi silahkan lakukan ulang QC internet IndiHome Anda.
      // <hr />`)
      // alert(`${a.statusText} please test https://myip.tacc.id`);
    },
  });
}

// mapping speedtest Ookla
function doOokla() {
  // panggil fungsi untuk mendapatkan long lat user
  getLocationUser();

  //aktivkan btn and select utk pilih server
  // $('#select-serverId').removeClass('hide')
  // $('#label-option').removeClass('hide')
  var timestamp = new Date().getTime();
  speedName = "ookla";
  document.getElementById("ookla").src =
    "https://test-inf-1.speedtestcustom.com";
  VarSpeed = 1;
}

//fungsi untuk mendapatkan long lat user yang menggunakan aplikasi ini
function getLocationUser() {
  const options = {
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 0,
  };

  function success(pos) {
    const crd = pos.coords;
    console.log("Your current position is:");
    console.log(`Latitude : ${crd.latitude}`);
    console.log(`Longitude: ${crd.longitude}`);
    console.log(`More or less ${crd.accuracy} meters.`);

    $.ajax({
      method: "post",
      dataType: "json",
      url: site_url(url_module + "/SaveLocation"),
      async: true,
      tryCount: 0,
      retryLimit: 3,
      timeout: 30000,
      data: {
        // uid: $("#uid").html(),
        uid: uid_task,
        latitude: crd.latitude,
        longitude: crd.longitude,
        nd: nd_number,
      },
      success: function (response) {
        // console.log(response);
      },
      error: function (xhr) {
        console.log(xhr);
        // if (xhr.status != 200 || xhr.statusText != "timeout") {
        // 	this.tryCount++;
        // 	if (this.tryCount <= this.retryLimit) {
        // 		//try again
        // 		$.ajax(this);
        // 		return;
        // 	}
        // }
        // console.log(xhr.status);
      },
    });
  }

  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);

    $.ajax({
      method: "post",
      dataType: "json",
      url: site_url(url_module + "/SaveErrGetLocation"),
      async: true,
      tryCount: 0,
      retryLimit: 3,
      timeout: 30000,
      data: {
        // uid: $("#uid").html(), // uid_task, //document.getElementById("uid").innerHTML,
        uid: uid_task,
        message: err.code + " " + err.message,
      },
      success: function (response) {
        // console.log(response);
      },
      error: function (xhr) {
        console.log(xhr);
        // if (xhr.status != 200 || xhr.statusText != "timeout") {
        // 	this.tryCount++;
        // 	if (this.tryCount <= this.retryLimit) {
        // 		//try again
        // 		$.ajax(this);
        // 		return;
        // 	}
        // }
        // console.log(xhr.status);
      },
    });
  }

  navigator.geolocation.getCurrentPosition(success, error, options);
}

function saveLocation() {
  $.ajax({
    method: "post",
    dataType: "json",
    url: site_url(url_module + "/SaveLocation"),
    async: true,
    tryCount: 0,
    retryLimit: 3,
    timeout: 30000,
    data: {
      // uid: $("#uid").html(), // uid_task, //document.getElementById("uid").innerHTML,
      uid: uid_task,
      latitude: crd.latitude,
      longitude: crd.longitude,
    },
    success: function (response) {
      console.log(response);
    },
    error: function (xhr) {
      if (xhr.status != 200) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          //try again
          $.ajax(this);
          return;
        }
      }
      console.log("tidak dapat menemukan lokasi");
    },
  });
}

// request input speedtest
function doSpeedtestDBT() {
  speedName = "dbt";
  $.ajax({
    method: "post",
    dataType: "json",
    url: site_url(url_module + "/RequestSpeedDBT"),
    async: true,
    timeout: 30000,
    data: {
      // uid: $("#uid").html(), //document.getElementById("uid").innerHTML,
      uid: uid_task,
    },
    success: function (response) {
      //jika gagal mendapatkan query string sbg inputan speedtest
      // maka panggil default query string speedtest
      if (!response.success) {
        document.getElementById("ookla").src =
          "https://speedtest-r-scc-v2.mysiis.io/?query=pc0%2B40%2FXNRRhNGn%2Be%2FTK3qj8fs7BdR5HzoREpwdrYpDFQneVK4TNE7RD6A5%2Bhy41jN7uxqv2q0zSbVOKhy61KAGnKyqTcoMIZAK%2Fqg4Uv9yE%2FGrvznQi65fR5L%2FdGHAlMTnjNyRMTooNHO0mq1HI3tjHcRZCKie8Ii8G0COrd7E%3D";
        VarSpeed = 0;
        return;
      }

      document.getElementById("ookla").src =
        "https://speedtest-r-scc-v2.mysiis.io/?v=" +
        new Date().getTime() +
        "&query=" +
        response.data.param;
      VarSpeed = 0;
      return;
    },
    error: function (a) {
      // doOokla();
      alert('40003 please Check your connection');
			finish('failed');
    },
  });
}

function doSpeedAcsis() {
  $("#loader-speed-acsis").removeClass("hide");
  $.ajax({
    method: "post",
    dataType: "json",
    url: site_url(url_module + "/retrieveSpeedAcsis"),
    async: true,
    tryCount: 0,
    retryLimit: 3,
    data: {
      // uid: $("#uid").html(), //document.getElementById("uid").innerHTML,
      uid: uid_task,
    },
    success: function (response) {
      $("#loader-speed-acsis").addClass("hide");
      if (response.success) {
        if (response.data.speed != 0) {
          $("#confirm-speed-acsis").val(response.data.speed);
        } else {
          $("#confirm-speed-acsis").val("-");
        }
      } else {
        finish("failed");
      }
    },
    error: function (err) {
      if (err.status != 200) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          //try again
          $.ajax(this);
          return;
        }
      }
      $("#message-failed").html("****failed, Silahkan lakukan ulang.");
      finish("failed");
    },
  });
}

// Check redaman iBooster dan Validasi kelayakan jaringan
function doRedaman() {
  $("#loader-redaman").removeClass("hide");
  $.ajax({
    method: "post",
    dataType: "json",
    url: site_url(url_module + "/retrieveUkur"),
    async: true,
    tryCount: 0,
    retryLimit: 3,
    timeout: 60000,
    data: {
      // uid: $("#uid").html(), //document.getElementById("uid").innerHTML,
      uid: uid_task,
    },
    success: function (response) {
      clearTimeout(timerWait5);
      flagRedaman = true;

      //matikan loader pada field kualitas jaringan
      $("#loader-redaman").addClass("hide");

      //jika response code api tidak sama 200 makan berikan notifikasi pada UI
      if (response.status != 200) {
        $("#show-finish-rdm").removeClass("hide");
        $("#ask-ticket").addClass("hide");
        $("#show-check").addClass("hide");
        return;
      }

      //jika gagal/tidak mendapatkan redaman maka berikan notifikasi/wording pada UI
      if (!response.success) {
        $("#show-finish-rdmn").removeClass("hide");
        $("#ask-ticket").addClass("hide");
        $("#show-check").addClass("hide");
        return;
      }

      // jika status "ISOLIRAN" atau Speedtest not mandatory
      // maka modal speedtest tidak di tampilkan
      if (packageName === "ISOLIRAN" || packageName === "INETBHOME" || speedMandatory === 0) {
        if (response.data.redaman_passed === 1) {
          $("#confirm-redaman").val("Layak");
          doIsolirND();
          return;
        }

        if (response.data.redaman_passed === 0) {
          $("#confirm-redaman").val("Belum Layak");
          doIsolirND();
          return;
        }

        $("#show-finish-rdmn").removeClass("hide");
        $("#ask-ticket").addClass("hide");
        $("#show-check").addClass("hide");
        return;
      }

      flagcontinue = true;
      if (response.data.redaman_passed == null) {
        $("#show-finish-rdmn").removeClass("hide");
        $("#ask-ticket").addClass("hide");
        $("#show-check").addClass("hide");
        return;
      }

      //inisiasi hasil dari redaman ke kolom kualitas jaringan
      response.data.redaman_passed == 1
        ? $("#confirm-redaman").val("Layak")
        : $("#confirm-redaman").val("Belum Layak");
      okRedaman = response.data.redaman_passed == 1 ? true : false;
      $("#ookla-test").modal("show");
    },
    error: function (err, t) {
      if (err.status != 200) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          //try again
          $.ajax(this);
          return;
        }
      }

      if (t == "timeout") {
        $("#show-finish-rdm").removeClass("hide");
        $("#ask-ticket").addClass("hide");
        $("#show-check").addClass("hide");
        return;
      }

      clearTimeout(timerWait5);
      $("#message-failed").html("*****failed, Silahkan lakukan ulang.");
      finish("failed");
    },
  });
}

// jika nomor pelanggan terisolir lakukan function ini
function doIsolirND() {
  $.ajax({
    method: "post",
    dataType: "json",
    url: site_url(url_module + "/retrieveIsolir"),
    async: true,
    tryCount: 0,
    retryLimit: 3,
    data: {
      // uid: $("#uid").html(), //document.getElementById("uid").innerHTML,
      uid: uid_task,
    },
    success: function (response) {
      $("#loader-speed").addClass("hide");
      sendAutoClose(1);

      if (response.data.speed_passed === 1) {
        $("#confirm-speed").val("Layak (Layanan ISOLIR)");
        return;
      }
      //
      $("#confirm-speed").val("Belum Layak");
    },
    error: function (err) {
      if (err.status != 200) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          //try again
          $.ajax(this);
          return;
        }
      }
      $("#message-failed").html("******failed, Silahkan lakukan ulang.");
      finish("failed");
    },
  });
}

function retrievepassed(attempt) {
  if (attempt < 4) {
    $.ajax({
      method: "post",
      dataType: "json",
      url: site_url(url_module + "/retrieveSpeed"),
      async: false,
      tryCount: 0,
      retryLimit: 3,
      // contentType: 'application/json',
      data: {
        // uid: $("#uid").html(), //document.getElementById("uid").innerHTML
        uid: uid_task,
      },
      success: function (response) {
        if (!response.success) {
          retrievepassed(attempt + 1);
          return;
        }

        response.data.speed_passed = Number(response.data.speed_passed);

        //inisiasi hasil kalkulasi kecepan internet pada kolom kecepatan jaringan
        if (response.data.speed_passed > 0) {
          $("#confirm-speed").val("Layak");
          okSpeed = true;
        } else {
          $("#confirm-speed").val("Belum Layak");
        }

        //panggil fungsi untuk menghasilkan result pengujian
        sendAutoClose(1);
      },
      error: function (err) {
        if (err.status != 200) {
          this.tryCount++;
          if (this.tryCount <= this.retryLimit) {
            //try again
            $.ajax(this);
            return;
          }
        }
        console.log(err);
        $("#message-failed").html("failed, Silahkan lakukan ulang.");
        finish("failed");
      },
    });
  } else {
    $("#message-failed").html("failed, Silahkan lakukan ulang.*");
    finish("failed");
  }
}

function sendAutoClose(attempt) {
  if (attempt < 4) {
    $.ajax({
      method: "post",
      dataType: "json",
      url: site_url(url_module + "/retrieveCloseAuto"),
      async: false,
      tryCount: 0,
      retryLimit: 3,
      data: {
        // uid: $("#uid").html(), //document.getElementById("uid").innerHTML,
        uid: uid_task,
      },
      success: function (response) {
        // matikan loader pada kolom Jarak ODP
        $("#loader-distance-odp").addClass("hide");

        // matikan loader pada kolom Jarak ODP
        $("#loader-longlat").addClass("hide");

        // matikan loader pada kolom Nama ODP
        $("#loader-odp-name").addClass("hide");

        // jika gagal kalkulasi hasil, maka lakukan ulang
        if (!response.success) {
          sendAutoClose(attempt + 1);
          return;
        }

        // inisiasi jarak ODP pada kolom Jarak ODP
        $("#confirm-odp").val(
          response.data.valueDistance != null
            ? response.data.valueDistance.toLocaleString() + " m"
            : "0"
        );

        $("#confirm-odp-name").val(
          response.data.odp_name != null
            ? response.data.odp_name.toLocaleString()
            : "-"
        );

        $("#confirm-longlat").val(
          response.data.odp_long !== null && response.data.odp_long !== undefined && response.data.odp_lat !== null && response.data.odp_lat !== undefined
              ? String(response.data.odp_lat +","+ response.data.odp_long)
              : "-" // Or any other default value you want to set
      );

        // munculkan wording ketika jarak lebih dari 1000
        // if (response.data.odp_check != 1) {
        //   finish("failed");
        //   $("#message-failed").html(
        //     "Mohon maaf QC internet anda tidak bisa di lanjutkan, karena jarak pengujian anda dari odp <b>" +
        //       response.data.valueDistance.toLocaleString() +
        //       " m </b> tidak memenuhi syarat untuk melakukan pengujian, mohon untuk melakukan uji jaringan pada titik lokasi yang terganggu."
        //   );
        //   return;
        // }
        if (response.data.close == 1) {
          $("#show-eligible-close-y").removeClass("hide");
        } else if(response.data.valueDistance > 1000 && response.data.redaman_check == 1 && response.data.speed_check == 1){
          $("#show-eligible-close-1000").removeClass("hide");
        } else if(response.data.valueDistance <= 1000 && response.data.redaman_check == 1 && response.data.speed_check == 1 && response.data.datek_check == 0){
          $("#show-eligible-close-datek").removeClass("hide");
        } else {
          $("#show-eligible-close-y").addClass("hide");
          $("#show-eligible-close-n").removeClass("hide");
        }

        $("#confirm-ts-finish").text(response.data.finish + " WIB");
      },
      error: function (err) {
        if (err.status != 200) {
          this.tryCount++;
          if (this.tryCount <= this.retryLimit) {
            //try again
            $.ajax(this);
            return;
          }
        }
        $("#message-failed").html("*failed, Silahkan lakukan ulang.*");
        finish("failed");
      },
    });
  } else {
    $("#message-failed").html("*failed, Silahkan lakukan ulang.**");
    finish("failed");
  }
}

function finish(s) {
  clearTimeout(timerWait0);
  $("#ask-wait-0").modal("hide");
  clearTimeout(timerWait1);
  clearTimeout(timerWait2);
  clearTimeout(timerWait3);
  clearTimeout(timerWait4);
  clearTimeout(timerWait5);
  clearTimeout(timerWait6);
  clearTimeout(timerWait7);
  $("#ask-wait-1").modal("hide");
  $("#ask-wait-2").modal("hide");
  $(".wizard").addClass("hide");
  $(".show-finish-sub").addClass("hide");
  $("#show-finish").removeClass("hide");
  $("#show-finish-" + s).removeClass("hide");
  $("#message-failed").removeClass("hide");
}
