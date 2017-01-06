/**
 * Much of this file's code was copied from this tutorial:
 * https://thinkster.io/tutorials/mean-stack/creating-an-angular-service-for-authentication
 */


var app = angular.module('rateMyLabPartners', ['ui.router']);



app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

	$stateProvider
		.state('home', {
			url: '/home',
			templateUrl: '/home.html',
			controller: 'MainCtrl',
      resolve: {
        // Whenever this state is entered, load the colleges
        collegesPromise: ['colleges', function(colleges) {
          return colleges.getAll();
        }]
      }
		})
    .state('login', {
      url: '/login',
      templateUrl: '/login.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        // redirect user to home state if already logged in
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    })
    .state('register', {
      url: '/register',
      templateUrl: '/register.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        // redirect user to home state if already logged in
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    })
    .state('colleges', { // state for showing one college
      url: '/colleges/{id}',
      templateUrl: '/colleges.html',
      controller: 'CollegesCtrl'
    });


	$urlRouterProvider.otherwise('home');
}]); // app.config()



var LocalStorageTokenName = 'rate-token';
app.factory('auth', [
'$http',
'$window',
function($http, $window) {
	var auth = {};

  auth.saveToken = function(token){
    $window.localStorage[LocalStorageTokenName] = token;
  };

  auth.getToken = function(){
    return $window.localStorage[LocalStorageTokenName];
  };

  // Returns true if the user is logged in
  auth.isLoggedIn = function(){
    var token = auth.getToken();

    if(token){
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      // check if the payload expired
      return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };

  // Returns username of the user that's logged in
  auth.currentUser = function(){
    if(auth.isLoggedIn()){
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.username;
    }
  };

  auth.register = function(user){
    return $http.post('/register', user).success(function(data){
      auth.saveToken(data.token);
    });
  }

  auth.logIn = function(user){
    return $http.post('/login', user).success(function(data){
      auth.saveToken(data.token);
    });
  };

  auth.logOut = function(){
    $window.localStorage.removeItem(LocalStorageTokenName);
  };

  return auth;
}]); // auth factory





app.factory('colleges', ['$http', 'auth', function($http, auth) {
  var c = {
    colleges: []
  };

  c.getAll = function() {
    return $http.get('/colleges').success(function(data){
      // create deep--not shallow--copy
      angular.copy(data, c.colleges);
    })
  };

  c.create = function(college) {
    return $http.post('/colleges', college).success(function(data){
      // So Angular's data matches database's
      c.colleges.push(data);
    });
  }; // create()

  return c;
}]); // colleges factory





app.controller('MainCtrl', [
'$scope',
'auth',
'colleges',
function($scope, auth, colleges){

  $scope.colleges = colleges.colleges;

  $scope.isLoggedIn = auth.isLoggedIn;

  /*
  $scope.colleges = [
    { name: "UC Santa Barbara"},
    { name: "UC Davis"},
    { name: "UC Irvine"}
  ];
  */

  $scope.addCollege = function(){
    if (!$scope.name || $scope.name === '') { return; }

    colleges.create({
      name: $scope.name
    })

    // Erase the form
    $scope.name = '';
  }; // addCollege()


  $("#college-search-button").click(function(){
    // Retrieve the name of the selected college from the
    // search bar
    var selectedCollege = $("#selected-college").val();

    if (selectedCollege != "") {
      // Use this name to find--by id--the corresponding option
      // element, and retrieve the url from that element
      var url = $("option[id='" + selectedCollege + "']").data("url");

      // Redirect to this url
      $("#search-redirection").attr("href", url).click();
    }
  })

}]); // MainCtrl controller



app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.user = {};

  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    })
  };
}]); // AuthCtrl controller



app.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth) {
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]); // NavCtrl controller



app.controller("CollegesCtrl", [
'$scope',
// 'college',
'auth',
function($scope, /*college,*/ auth){
  // $scope.college = college;
}]); // CollegesCtrl controller
