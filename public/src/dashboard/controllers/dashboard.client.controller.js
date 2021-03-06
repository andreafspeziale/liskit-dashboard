/**
 * Created by andreafspeziale on 13/04/16.
 */
dashboard.controller('DashboardController', ['$scope', 'LiskServices','$http', 'ExchangeServices', '$aside','usSpinnerService', 'EnvServices', 'BackendServices',
    function($scope, LiskServices, $http, ExchangeServices, $aside, usSpinnerService, EnvServices, BackendServices) {

        console.log('Hey, what are you looking for here? ;)');
        usSpinnerService.spin('spinner-voters');

        /**
         * Vars
         */

        var body = angular.element( document.querySelector( 'body' ) );
        var aside = angular.element( document.querySelector( 'aside' ) );

        var liskit_address = EnvServices.poolAddress;
        var gdt_address = EnvServices.gdtPoolAddress;
        // $scope.swap_holding = EnvServices.swapHolding;
        $scope.forging_shares = {};

        $scope.address_forging = '';
        $scope.voters_account = [];
        $scope.guest_address = '';
        $scope.delegates = [];
        $scope.delegates_total_balance = 0;
        $scope.gdt_total_shared = 0;
        $scope.pagination = {
            currentPage : 1,
            itemsPerPage :10,
            maxSize : 3
        };

        /**
        * Asides
        */

        $scope.detail_aside = $aside({
            scope: $scope,
            animation: 'am-slide-right',
            templateUrl: './public/src/detail/views/detail.html',
            show: false,
            keyboard: false,
            backdrop: true,
            tag: 'detailAside'
        });

        $scope.$on('aside.hide', function(e, target) {
          if (target.$options.tag == 'detailAside') {
            body.removeClass('overflow-hidden');
            aside.removeClass('overflow-scroll');
          }
        });

        /**
        * Close / open asides
        */

        $scope.openDetail = function(address,balance){
            console.log('Open detail');
            console.log('Address setted: ', address);
            $scope.address_forging = address;
            $scope.balance_forging = balance;
            $scope.closeDetail();
            body.addClass('overflow-hidden');
            aside.addClass('overflow-scroll');
            $scope.detail_aside.show();
        };

        $scope.closeDetail = function(){
            var myEl = angular.element( document.querySelector( 'body' ) );
            body.removeClass('overflow-hidden');
            aside.removeClass('overflow-scroll');
            $scope.detail_aside.hide();
        };

        /**
         * Graph config
         */

        var uptime_graph_config = liquidFillGaugeDefaultSettings();
            uptime_graph_config.circleColor = "#94A9BE";
            uptime_graph_config.textColor = "#94A9BE";
            uptime_graph_config.textSize = 0.55;
            uptime_graph_config.waveTextColor = "#fff";
            uptime_graph_config.waveColor = "rgba(148, 169, 190, 0.72)";
            uptime_graph_config.circleThickness = 0.1;
            uptime_graph_config.circleFillGap = 0.2;
            uptime_graph_config.textVertPosition = 0.5;
            uptime_graph_config.waveAnimateTime = 2000;
            uptime_graph_config.waveHeight = 0.3;
            uptime_graph_config.waveCount = 1;

        /**
         * Pagination handler
         */

        $scope.pageChanged = function() {
            $log.log('Page changed to: ' + $scope.pagination.currentPage);
        };

        /**
         * Dashboard functions
         */

        $scope.calculateForgingShares = function() {
            if(EnvServices.dynamicPool) {
                $scope.$watchGroup(['rank'],function(newValues, oldValues, scope){
                    if($scope.rank >= 50) {
                        $scope.forging_shares['maintenance_perc'] = EnvServices.maintenancePerc
                        $scope.forging_shares['stack_perc'] = 100-EnvServices.maintenancePerc-EnvServices.top101perc
                        $scope.forging_shares['share_perc'] = EnvServices.top101perc
                    }
                    if($scope.rank < 50 && $scope.rank >= 20) {
                        console.log("rank less than 50");
                        $scope.forging_shares['maintenance_perc'] = EnvServices.maintenancePerc
                        $scope.forging_shares['stack_perc'] = 100-EnvServices.maintenancePerc-EnvServices.top101perc
                        $scope.forging_shares['share_perc'] = EnvServices.top50perc
                    }
                    if($scope.rank < 20) {
                        $scope.forging_shares['maintenance_perc'] = EnvServices.maintenancePerc
                        $scope.forging_shares['stack_perc'] = 100-EnvServices.maintenancePerc-EnvServices.top101perc
                        $scope.forging_shares['share_perc'] = EnvServices.top20perc
                    }
                })
            } else {
                $scope.forging_shares['maintenance_perc'] = EnvServices.maintenancePerc
                $scope.forging_shares['stack_perc'] = 100-EnvServices.maintenancePerc-EnvServices.staticPerc
                $scope.forging_shares['share_perc'] = EnvServices.staticPerc
            }
        }

        LiskServices.getTransactions(liskit_address, gdt_address).then(function(list) {
            usSpinnerService.stop('spinner-payments');
            console.log(list.transactions)
            $scope.delegates_total_balance = list.transactions.reduce(function(sum, item) {
                return sum + item.amount
            }, 0);
        }, function (error) {
            console.log('getTransactions function error');
            console.log(error);
        });

        $scope.getBalance = function(address) {
            LiskServices.getBalance(address).then(function (balance) {
                BackendServices.getLastPayoutInfo().then(function (forged) {

                    usSpinnerService.stop('spinner-forging-pool');
                    $scope.balance = (0 + forged.result.forged)/10000/10000;
                    $scope.payday = forged.result.date;

                }, function (error) {
                    console.log('getLastPayoutInfo function error');
                    console.log(error);
                })
            }, function (error) {
                console.log('getBalance function error');
                console.log(error);
            });
        };

        $scope.getDelegateList = function() {
          LiskServices.getDelegates().then(function(list) {
                $scope.delegates = list.delegates;
                console.log($scope.delegates);
            }, function (error) {
                console.log('getDelegates function error');
                console.log(error);
            });
        };

        // Turn Around
        $scope.getVotesOfAccount = function(address) {
            LiskServices.getVotesOfAccount(address).then(function (delegates) {
                angular.forEach(delegates.delegates, function(delegate){
                    if(delegate.address == liskit_address){
                        $scope.rank = delegate.rate;
                        $scope.productivity =  delegate.productivity;
                        if($scope.productivity != 0 )
                            var uptime_graph = loadLiquidFillGauge("uptime", $scope.productivity, uptime_graph_config);
                    }
                });
            }, function (data) {
                console.log('getDelegateStats function error');
                console.log(data);
            });
        };

        $scope.totalDelegatesForged = function() {
            LiskServices.getDelegateStats().then(function (delegates) {
                $scope.total_delegate = delegates.totalCount;
                angular.forEach(delegates, function(delegate){
                    angular.forEach(delegate, function(value){
                        LiskServices.getBalance(value.address).then(function (balance) {
                            $scope.delegates_total_balance = $scope.delegates_total_balance + balance.balance/10000/10000;
                        }, function (error) {
                            console.log('totalDelegatesForged function error');
                            console.log(data);
                        });
                    });
                });
            }, function (data) {
                console.log('totalDelegatesForged function error');
                console.log(data);
            });
        };

        $scope.getNumberOfVoters = function(address) {
            //console.log('Loading getNumberOfVoters function');
            LiskServices.getPublicKey(address).then(function (public_key) {
                var public_key = public_key.publicKey;
                LiskServices.getVoters(public_key).then(function(voters) {
                    $scope.voters = voters.accounts;
                    $scope.number_of_voters = $scope.voters.length;
                })
            }, function(data) {
                console.log('getPublicKey function error');
                console.log(data);
            })
        };


        $scope.getVoters = function(address) {
            $scope.guest_voters_account = [];
            $scope.error_message = '';
                $scope.delegates = $scope.totalDelegatesRegistered;
                LiskServices.getPublicKey(address).then(function (public_key) {
                    if (public_key.success == true) {
                        var public_key = public_key.publicKey;
                        LiskServices.getVoters(public_key).then(function (voters) {
                            if (voters.accounts.length) {
                                $scope.voters = voters.accounts;
                                for(j = 0; j<$scope.voters.length; j++) {
                                    var flag = 0;
                                    for(var i = 0; i<$scope.delegates.length; i++) {
                                        if($scope.delegates[i].address == $scope.voters[j].address) {
                                            var tmp = $scope.voters[j];
                                            tmp.rate = $scope.delegates[i].rate;
                                            if (address == liskit_address) {
                                                $scope.voters_account.push(tmp);
                                            }
                                            if (address != liskit_address) {
                                                $scope.guest_voters_account.push(tmp);
                                            }
                                            flag = 1;
                                            break;
                                        }
                                    }
                                    if(flag==0){
                                        if (address == liskit_address) {
                                            $scope.voters_account.push($scope.voters[j]);
                                        }
                                        if (address != liskit_address) {
                                            $scope.guest_voters_account.push($scope.voters[j]);
                                        }
                                    }
                                }
                            } else {
                                toastr.warning("This address doesn't have any supporter");
                                $scope.guest_voters_account = [];
                                $scope.guestFilterSearch = '';
                            }
                        }, function (data) {
                            console.log('getVoters function error');
                            console.log(data);

                        })
                    } else {
                        $scope.guest_voters_account = [];
                        $scope.guestFilterSearch = '';
                        $scope.guest_address = '';
                        $scope.error_message = public_key.error;
                        toastr.warning(public_key.error);
                    }
                }, function (data) {
                    console.log('getPublicKey function error');
                    console.log(data);
                })

        };

        $scope.getBlockChainHeight = function() {
            LiskServices.getBlockChainHeight().then(function(blockchain_height) {
                $scope.blockchain_height = blockchain_height.height;
            }, function(data) {
                console.log('getBlockChainHeight function error');
                console.log(data);
            });
        };

        $scope.getSynchronisationStatus = function(client_ip) {
            LiskServices.getSynchronisationStatus(client_ip).then(function(status) {
                $scope.status = status.success.toString();
            }, function(data) {
                console.log('getSynchronisationStatus function error');
                console.log(data);
            });
        };

        $scope.getTotalRegisteredDelegates = function() {
            var counter = 1;
            $scope.totalDelegatesRegistered = [];
            LiskServices.getDelegateStats().then(function (delegates) {
                var delegates = delegates.totalCount;
                while (counter < delegates) {
                    LiskServices.getDelegates(counter).then(function (list) {
                        angular.forEach(list.delegates, function(value){
                            $scope.totalDelegatesRegistered.push(value);
                        })
                        if($scope.totalDelegatesRegistered.length == delegates-1){
                            $scope.getVoters(liskit_address);
                        }
                    }, function (error) {
                        console.log('getDelegates function error');
                        console.log(error);
                    });
                    counter += 101;
                }
            }, function (error) {
                console.log('getDelegateStats function error');
                console.log(error);
            });
        };

        /**
         * Exchange test - getting BTC:ALTCOIN status - example below
         * Arguments:
         *      polo for Poloniex
         * Arguments
         *      LSK for lisk
         */

        $scope.getTicker = function() {
            ExchangeServices.getTicker('polo', 'LSK').then(function (response) {
                $scope.liskLastPrice = response.last;
            }, function (error) {
                console.log('getTicker lisk service promise rejected');
                console.log(error);
            });
        };

        /**
         * Run
         */
        $scope.getTotalRegisteredDelegates();
        $scope.getBlockChainHeight();
        $scope.getBalance(liskit_address);
        $scope.getNumberOfVoters(liskit_address);
        //$scope.getDelegateStats(liskit_address);
        $scope.getVotesOfAccount(liskit_address);
        $scope.totalDelegatesForged();
        $scope.getSynchronisationStatus();
        $scope.getTicker();
        $scope.calculateForgingShares();
    }])
    /**
     * Pagination custom filter
     */
    .filter('startFrom', function() {
        return function(input, start) {
            if (!input || !input.length) { return; }
            start = +start;
            return input.slice(start);
        }
    });
