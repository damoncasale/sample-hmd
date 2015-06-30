
angular.module('hmd.controllers', [])

.controller('DashCtrl', ['$scope', '$timeout', '$stateParams', '$ionicPopup',
	'ServerLogic', 'Properties', 'PropertyCalcs', function($scope, $timeout,
	$stateParams, $ionicPopup, ServerLogic, Properties, PropertyCalcs) {
	$scope.isProcessing = true;
	$scope.canvas = null;
	$scope.fabric = null;
	$scope.hasSVGSupport = false;
	if (document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1")) {
	  $scope.hasSVGSupport = true;
	}
  $scope.properties = Properties.all();
  if (("" != $stateParams.propertyId) && (null != $stateParams.propertyId)) {
		$scope.propertyId = $stateParams.propertyId;
		$scope.property = Properties.get($stateParams.propertyId);
	} else {
		$scope.propertyId = null;
		$scope.property = {};
	}

	$scope.updateProperty = function(refresh) {
		var capRate, degrees;

		$scope.isProcessing = true;
		$scope.property.vacancyLoss = $scope.vacancyLoss();
		$scope.property.operatingIncome = $scope.operatingIncome();
		$scope.property.insuranceTaxes = $scope.getInsuranceTaxes();
		$scope.property.management = $scope.management();
		$scope.property.maintenanceAndRepairs = $scope.maintenanceAndRepairs();

		$scope.isProcessing = false;
		$scope.updatePropertyDependent(refresh);
	};

	$scope.updatePropertyDependent = function(refresh) {
		$scope.property.operatingIncome = $scope.operatingIncome();
		$scope.property.totalCash = $scope.totalCash();
		$scope.property.noi = $scope.noi();
		$scope.property.cashFlow = $scope.cashFlow();
		$scope.property.capRate = $scope.capRate();

		capRate = $scope.property.capRate;
		if (capRate > 14) {
			capRate = 14;
		}
		degrees = 13 * (capRate - 7);
		/*
		console.log("Pointer width = " + String($scope.pointerObj.width) +
			", height = " + String($scope.pointerObj.height));
		*/
		if ($scope.hasSVGSupport) {
			$scope.rotate = $scope.svg.getElementById("rotate");
			$scope.rotate.setAttribute("transform", "rotate(" + String(degrees) + ", 320, 334)");
		} else {
	  	$scope.fabric = $scope.canvas.getContext('2d');
	  	$scope.fabric.clearRect(0,0,$scope.canvas.width,$scope.canvas.height);
	  	$scope.fabric.save();
	  	$scope.fabric.translate(Math.floor($scope.canvas.width/2),Math.floor($scope.canvas.height * 0.85));
	  	$scope.fabric.rotate(degrees*Math.PI/180);
	  	$scope.fabric.translate(-1 * Math.floor($scope.pointerObj.width/2),-1 * Math.floor($scope.pointerObj.height * 0.8));
	  	$scope.scale_y = $scope.canvas.height / $scope.pointerObj.height;
	  	$scope.scale_x = $scope.canvas.width / $scope.pointerObj.width;
	  	$scope.scale = ($scope.scale_y < $scope.scale_x) ? $scope.scale_y : $scope.scale_x;
	  	$scope.fabric.drawImage($scope.pointerObj,0,0);
	  	$scope.fabric.restore();
	  }
  	if (("undefined" != typeof refresh) && refresh) {
  		$scope.$apply();
  	}
	};

	$scope.createProperty = function(property, tries) {
		/*
    var v = PropertyCalcs.parseAddress(property.fulladdress);
    	console.log("addr: " + v.addr + ", zip: " + v.zip);
    */
    if ("undefined" == typeof tries) {
    	tries = 3;
    }

    ServerLogic.getZillowData(property.address, parseInt(property.zip))
    	.then(function(data) {
          var result,
          	prop = {};
          if (("undefined" != typeof data.response) && ("undefined" != typeof data.response.results)) {
	          result = data.response.results.result;
	          console.log(result);

	          prop.id = parseInt(result.zpid);
	          prop.zpid = result.zpid;
	          prop.purchase = parseInt(result.zestimate.amount['#text']);
	          prop.taxAssessment = parseInt(result.taxAssessment);
	          if ("undefined" != typeof result.rentzestimate)
	          {
	            prop.rent = parseInt(result.rentzestimate.amount['#text']);
	          }
	          prop.address = result.address.street;
	          prop.state = result.address.state;
	          prop.city = result.address.city;
	          prop.zip = result.address.zipcode;

	          prop.units = 1;
	          prop.type = "Single Family";
	          prop.utilitieshoa = 0;
	          prop.otherexpenses = 0;
	          //prop.yardwork = 0;

	          prop.buycosts = 0;
	          prop.improvecost = 0; 
	          prop.otherincome = 0;

	          prop.percvacloss = 8;
	          prop.percmnr = 1;
	          prop.percmanage = 10;

	          // Debug
	          Properties.clear();
	          // Don't need to check to see if it's already saved,
	          // since we can just update what's there.
	          Properties.set(prop);
	          Properties.save();
	          $scope.propertyId = prop.id;
	          $scope.property = Properties.get(prop.id);
	          $timeout(function() {
		          if (null == $scope.fabric) {
		          	if ($scope.hasSVGSupport) {
			          	$scope.svg = document.getElementsByTagName('svg')[0];
			          	$scope.svg.style.display = "block";
			          	$scope.meter = $scope.svg.parentNode.getElementsByTagName('img')[0];
			          	$scope.meterParent = $scope.meter.parentNode;
			          	$scope.meterParent.style.height = String($scope.meter.height) + "px";
			          	$scope.svg.width = $scope.meter.width;
			          	$scope.svg.height = $scope.meter.height;
			          	$scope.isProcessing = false;
			          	$scope.updateProperty();
		          	} else {
			          	$scope.canvas = document.getElementsByTagName('canvas')[0];
			          	$scope.canvas.style.display = "block";
			          	$scope.meter = $scope.canvas.parentNode.getElementsByTagName('img')[0];
			          	$scope.meterParent = $scope.meter.parentNode;
			          	$scope.meterParent.style.height = String($scope.meter.height) + "px";
			          	$scope.canvas.width = $scope.meter.width;
			          	$scope.canvas.height = $scope.meter.height;

			          	$scope.pointerObj = new Image();
			          	$scope.pointerObj.onload = function() {
			          		$scope.isProcessing = false;
			          		$scope.updateProperty(true);
			          	};
			          	$scope.pointerObj.src = "img/meterneedle-03.png";
			          }
		          }
	          });
					$scope.$watch( function() {
						return $scope.property.purchase;
					}, function( purchase ) {
						if (!$scope.isProcessing) {
							$scope.updateProperty();
						}
					});
					$scope.$watchCollection(
						'[ property.vacancyLoss, property.buycosts, property.improvecost, property.rent, ' +
						'property.utilitieshoa, property.otherexpenses, ' +
						'property.insuranceTaxes, property.management, ' +
						'property.maintenanceAndRepairs ]', function( newvalues, oldvalues, scope ) {
						if (!$scope.isProcessing) {
							$scope.updatePropertyDependent();
						}
					});
				} else {
					$scope.propertyId = null;
					$scope.property = {};
					$ionicPopup.show({
						title: "Oops, sorry!",
		    		template: "We can't find this property.  Can you check the street address and zip code, thanks.",
		    		scope: $scope,
		    		buttons: [{
		    			text: 'OK',
		    			type: 'button-default'
		    		}]
					}).then(function() {
						// Do nothing
					});
				}
    	}, function(msg) {
	      tries--;
	      if (0 == tries) {
	      } else {
	      	$scope.createProperty(property, tries);
	      }
    	});
	};

	$scope.chooseProperty = function(propertyId) {
		var p = Properties.get(propertyId);
		if (null != p) {
			$scope.propertyId = propertyId;
			$scope.property = p;
		} else {
			$ionicPopup.show({
				title: "Error",
    		template: "Couldn't load property!",
    		scope: $scope,
    		buttons: [{
    			text: 'OK',
    			type: 'button-default'
    		}]
			}).then(function() {
				// Do nothing
			});
		}
	};

  $scope.totalCash = function() {
    return PropertyCalcs.totalCash($scope.property, false);
  };

  $scope.vacancyLoss = function() {
    return PropertyCalcs.vacancyLoss($scope.property, false);
  };

  $scope.operatingIncome = function() {
    return PropertyCalcs.operatingIncome($scope.property, false);
  };

  $scope.maintenanceAndRepairs = function() {
    return PropertyCalcs.maintenanceAndRepairs($scope.property, false);
  };

  $scope.management = function() {
    return PropertyCalcs.management($scope.property, false);
  };

  $scope.totalExpenses = function() {
    return PropertyCalcs.totalExpenses($scope.property, false);
  };

  $scope.noi = function() {
    return PropertyCalcs.noi($scope.property, false);
  };

  $scope.cashFlow = function() {
  	return this.noi();
  };

  $scope.capRate = function() {
    return PropertyCalcs.capRate($scope.property);
  };

  $scope.getInsurance = function() {
    return PropertyCalcs.getInsurance($scope.property, false);
  };

  $scope.getTaxes = function() {
    return PropertyCalcs.getTaxes($scope.property, false);
  };

  $scope.getInsuranceTaxes = function() {
    return Math.round($scope.getInsurance() + $scope.getTaxes());
  };
}])

.controller('AccountCtrl', function($scope) {
});


/*
Formulas:

	Total Cash: Purchase Price + Buying Costs + Improvement Estimate
	Vacancy Loss: Rent * percvaloss
	Operating Income: rent + valoss + other income
	MnR: purchase price * percmnr / 12
	property management: rent * percmanagement
	total expenses: sum(all expenses)
	noi: operating income - total expenses
	cash flow: same as above
	cap rate: cash flow * 12 / total cash

*/