/* ------------------------------------------------------------- */
    // File Upload
    /* ------------------------------------------------------------- */

    function uploader() {
        if(this.value){
          size = 0;
          $.each($(this)[0].files, function(index){
            size += this.size;
          })

          if(size > 30 * 1024 * 1024){
            alert("The collective filesize is over the size limit for one upload! Try uploading large files one by one. The maximum filesize per image is 7MB.")
            $('#photo_upload_form').resetForm();
          } else {
            //$("#files_display").html(str);
            $('#photo_upload_form').ajaxSubmit({
              beforeSubmit: function() {
                  $('#loaded').css({"width": "2%" })

                  $('#loading').show();
              },
              success: function(data) {
                  var index = $('#index');
                  index.prepend(data);
                  $('#loading').slideUp();
                  $('#loaded').slideUp('slow');
                  $('#photo_upload_form').resetForm();
                  new ExpandableForms();
                  prioritizer();
                  deleter();
                  sizing();
                  $('.no_photos').slideUp('fast');

              },
              uploadProgress: function(event, position, total, percentComplete){
                $('#loaded').css({"width":percentComplete + "%" })
              }
            });
          }
        }
      }

    $('#files').bind('change', uploader).change();