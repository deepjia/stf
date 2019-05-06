module.exports = function SignInCtrl($scope, $http) {

  $scope.error = null

  $scope.submit = function() {
    var name =  $scope.signin.username.$modelValue;
    var password = $scope.signin.email.$modelValue;
    var mail="abc@126.com";
    if(true)
    {
      var canLogin = false;
      var data = {
        name: $scope.signin.username.$modelValue
        , email: mail
        , password: $scope.signin.email.$modelValue
      }
      $http.post('/auth/api/v1/mock', data)
        .success(function(response) {
          console.log(response.isLogin)
          if(response.isLogin==true){
            canLogin = true;
            mail=response.email;
            //
            if(canLogin==true){             
              var data = {
                name: $scope.signin.username.$modelValue
                , email: mail
                , password: $scope.signin.email.$modelValue
              }
              $http.post('/auth/api/v1/mock', data)
                .success(function(response) {
                  console.log(mail);
                  location.replace(response.redirect)
                })
                .error(function(response) {
                })
            }
            //
          }
          else{
            alert("账号或密码错误，请联系系统管理员");
          }
        })
        .error(function(response) {
          alert("账号或密码错误，请联系系统管理员");
        })
    }
  }
}
