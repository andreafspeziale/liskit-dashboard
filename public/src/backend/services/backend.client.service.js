backend.factory('BackendServices', ['$http', '$q', 'EnvServices', function($http, $q, EnvServices) {

    var local = EnvServices.backEndIp;

    // will all return promise objects
    return {
        getForgingInfo: function(address) {
            console.log('Address for our backend: ', address);
            return $http.get(local + '/getforginginfo/'+address)
                .then(function(response) {
                    if (typeof response.data === 'object') {
                        return response.data;
                    } else {
                        console.log('getForgingInfo lisk service invalid response from API');
                        return $q.reject(response.data);
                    }

                }, function(response) {
                    console.log('getForgingInfo lisk service promise rejected');
                    return $q.reject(response.data);
                });
        }
    }
}]);
