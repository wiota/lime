$(document).ready(function(){

  $('.admin_flashes').delay(1000).fadeOut(1000);
  $('.admin_flashes').on('click', function(){
    this.remove();
  })
})