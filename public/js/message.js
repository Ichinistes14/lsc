function roundUp(n) {
  return "$" + Math.ceil(n / 1000) * 1000;
}

$(document).ready(function () {
  function clear() {
    return $("#messageContent").val("");
  }

  $("#messageContent").on("input", function (e) {
    e.preventDefault();
    const content = $("#messageContent").val();

    $("#previewMessage").html(`<pre>${previewMarkdown(content)}</pre>`);
  });

  $("#previewMessage").on("click", ".hidden-container", function () {
    $(this).css("background-color", "transparent").css("color", "#fff");
  });

  $("#copyMessage").click(function () {
    $("#messageContent").select();
    document.execCommand("copy");
  });

  $("#primeExemple").click(async function () {
    clear();

    // DEBUT MESSAGE //
    const currentDate = new Date();
    var message = `Bonsoir <@&983059253587767321> : Dimanche ${String(
      currentDate.getDate()
    ).padStart(2, "0")}/${String(currentDate.getMonth() + 1).padStart(
      2,
      "0"
    )}/${currentDate.getFullYear()} \n\n`;

    // PRIMES & PROMOTIONS //

    message += "**Primes et promotions :** \n\n";

    var data;

    await $.ajax({
      url: "/api/getData",
      method: "POST",
      success: async function (response) {
        data = await response;
      },
    });

    const grades = [
      "Apprenti",
      "Mécanicien",
      "Expérimenté",
      "Sécurité",
      "Chef Sécurité",
      "Chef d'Atelier",
      "Chef SP",
    ];

    for (const grade of grades) {
      const employeesInGrade = data.filter((e) => e.grade === grade && e.name);
    
      if (employeesInGrade.length > 0) {
        message += `**${grade} :**\n`;
    
        employeesInGrade.forEach((employee) => {
          const prime = Number(employee.prime.replace(/[\s$]+/g, ""));
          const adjustedPrime = grade !== "Sécurité" && prime < 5000 ? 0 : prime;
          message += `> ${employee.name} : ${roundUp(adjustedPrime)}\n`;
        });
    
        message += `\n`;
      }
    }

    // AUTRES //

    message +=
      "Vos fiches ont été remis a 0.\nVous pouvez désormais attaqué votre nouvelle semaine.";

    $("#messageContent").val(message);
    $("#previewMessage").html(`<pre>${previewMarkdown(message)}</pre>`);
  });

  $("#clear").on("click", function () {
    clear();
    $("#previewMessage").html("");
  });

  function previewMarkdown(text) {
    const decodedText = text.replace(/&gt;/g, ">");
    const htmlText = decodedText
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.*?)__/g, "<u>$1</u>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(
        /(^|\n)> (.*?)(?=\n|$)/g,
        "\n<blockquote class='border rounded-5'>$2</blockquote>"
      )
      .replace(/\|\|(.*?)\|\|/g, '<div class="hidden-container">$1</div>');

    return htmlText;
  }

  const $textarea = $("#messageContent");
  const $resizeIcon = $(".resize-icon");

  $textarea.on("input", function () {
    $(this).height("100px");
    $(this).height(this.scrollHeight + "px");
  });

  $resizeIcon.on("mousedown", function (e) {
    e.preventDefault();

    const startY = e.clientY;
    const startHeight = parseInt($textarea.css("height"), 10);

    function mouseMoveHandler(e) {
      const newHeight = startHeight + (e.clientY - startY);
      $textarea.css("height", newHeight + "px");
    }

    function mouseUpHandler() {
      $(document).off("mousemove", mouseMoveHandler);
      $(document).off("mouseup", mouseUpHandler);
    }

    $(document).on("mousemove", mouseMoveHandler);
    $(document).on("mouseup", mouseUpHandler);
  });
});