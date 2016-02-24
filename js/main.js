(function() {
'use strict';

var generateBusy = false;

var clipboard = new Clipboard('#passwordClipboard');

var backupPNG = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABABAMAAABYR2ztAAAAMFBMVEUAder////' +
                'w9/5+u/W/3vpcqvM6mPDg7/0oj+8Th+2ezPiv1PrP5vxLoPKOw/dtsvUGWXKKAA' +
                'ABG0lEQVRIx2MYBaMAJ2A2BgIDPAoYBYFAAY8CFpACBzwKuEEKHuBzA0hBAB4Fv' +
                'CAFCXgUsIEU4JJcNQFIAOXFgRSnDRYFilIJQEJQUAQov1BwAjbTRRIYHAUFhRnY' +
                'gOQHDAV8gkAVFx4KCsqyFgKZGzAUsAuC7AfqlVbEHpwTBVGAGIaCj6gKhDEUOKI' +
                'qkMFQgCqPGVycWxSRpYW8MQOCoe0zVJGLcRqu4D4I1t2AM654IOZr4JLnANqA14' +
                'gmkCwonNXwGCAViDtRBYGkJMFxIopNnhVs/wIghcOISWD3TWAoBNGy2JxwEBJHY' +
                'EdgzV1ckGQAckQFAy5XGoDdIocroA4KgahCIZw5gwvsvcANuDPOBXD2YhgFowAX' +
                'AAC++S7crZ6ECQAAAABJRU5ErkJggg==';

clipboard.on( 'success', function( e ) {
    app.tooltip = 'Copied!'

    e.clearSelection();
});

clipboard.on( 'error', function( e ) {
    if ( /Mac/i.test( navigator.userAgent ) ) {
        app.tooltip = 'Press &#8984;-C to copy.';
    }
    else {
        app.tooltip = 'Press Ctrl-C to copy.';
    }
} );

var app = new Vue({
    el: '#justpass',
    data: {
        rule: ['digit', 'lower_alpha', 'upper_alpha', 'symbol'],
        length: 16,
        generateStatus: 'primary',
        saveStatus: 'disabled',
        view: '',
        title: '',
        account: '',
        website: '',
        key: '',
        passphrase: '',
        openStatus: '',
        keychain: {},
        id: '',
        actionDisabled: 'disabled',
        hiddenKey: '',
        tooltip: '',
        group: location.hash && location.hash.length > 1 ? location.hash.substr(1).toLowerCase() : 'all',
        labels: [],
        message: '',
        avatars: ['key', 'google', 'gmail', 'amazon', 'twitter', 'facebook',
            'battlenet', 'steam', 'v2ex', 'disqus', 'wikipedia', 'paypal', 'qq',
            'taobao', 'microsoft', 'linkedin', 'ebay', 'yandex', 'vk', 'icloud',
            'blogspot', 'pinterest', 'wordpress', 'mailru', 'tumblr', 'imgur',
            'imdb', 'stackoverflow', 'odnoklassniki', 'github', 'gitlab',
            'dropbox', 'jd', 'yahoo', 'telegram', 'skype', 'ssh', 'office',
            'jianguoyun', 'weixin'],
        showAvatar: false,
        currentAvatar: 'key',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        messagebox: '',
    },
    methods: {
        generate: function() {
            if ( this.generateStatus === 'disabled' || generateBusy ) {
                return;
            }

            generateBusy = true;
            var scope = this;
            scope.$set( 'key', 'loading...' );

            getRandomKey( scope.length, scope.rule, function( key ) {
                scope.$set( 'key', key );
                generateBusy = false;
            });
        },
        save: function() {
            if ( this.saveStatus === 'disabled' ) {
                return;
            }
            var id = this.id || uuid.v4();
            var keychain = this.keychain[id] || {};
            keychain.flag = keychain.flag || false;
            keychain.avatar = this.currentAvatar;
            keychain.sortableTitle = this.title.substr( 0, 1 ).toLowerCase() + '-' + this.title;
            keychain.title = this.title;
            keychain.account = this.account;
            keychain.key = this.key;
            keychain.website = this.website;
            keychain.labels = this.labels.sort( function( a, b ) {
                var labels = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'];
                return labels.indexOf( a ) - labels.indexOf( b );
            } );
            keychain.modifiedDate = getTime();
            keychain.createdDate = keychain.createdDate || keychain.modifiedDate;
            localStorage[id] = crypteCode( keychain, this.passphrase );
            Vue.set( this.keychain, id, keychain );
            this.viewItem( id );
        },
        setPassphrase: function() {
            for ( var id in this.keychain ) {
                if ( id !== 'identification' ) {
                    localStorage[id] = crypteCode( this.keychain[id], this.passphrase );
                }
            }
            localStorage.identification = getIdentification( this.passphrase );
        },
        open: function() {
            var scope = this;
            if ( scope.passphrase && !localStorage.identification ) {
                scope.setPassphrase();
                scope.openStatus = 'open';
            } else if ( !scope.passphrase || localStorage.identification !== getIdentification( scope.passphrase ).toString() ) {
                scope.openStatus = 'error';
                setTimeout( function() {
                    scope.openStatus = '';
                }, 600 );
            } else {
                decryptCode( scope.passphrase );
                scope.openStatus = 'open';
            }
        },
        checkEnter: function( event ) {
            if ( event.keyCode === 13 ) {
                this.open();
            }
        },
        addNew: function() {
            this.$set( 'currentAvatar', 'key' );
            this.$set( 'title', '' );
            this.$set( 'account', '' );
            this.$set( 'website', '' );
            this.$set( 'key', '' );
            this.$set( 'length', 16 );
            this.$set( 'id', '' );
            this.$set( 'labels', [] );
            this.$set( 'actionDisabled', 'disabled' );
            this.$set( 'view', 'new' );
            setTimeout( function() {
                document.getElementById( 'new' ).scrollTop = 0;
            }, 0 );
        },
        viewItem: function( id ) {
            this.$set( 'id', id );
            this.$set( 'currentAvatar', this.keychain[id].avatar );
            this.$set( 'actionDisabled', '' );
            this.$set( 'hiddenKey', new Array( this.keychain[id].key.length + 1 ).join( '&bull;' ) );
            this.$set( 'view', 'item' );
            if ( document.getElementById( 'passwordClipboard' ) ) {
                document.getElementById( 'passwordClipboard' ).setAttribute( 'data-clipboard-text', this.keychain[id].key );
            }
        },
        edit: function() {
            if ( this.actionDisabled === 'disabled' ) {
                return;
            }
            this.$set( 'title', this.keychain[this.id].title );
            this.$set( 'account', this.keychain[this.id].account );
            this.$set( 'website', this.keychain[this.id].website );
            this.$set( 'key', this.keychain[this.id].key );
            this.$set( 'length', this.keychain[this.id].key.length );
            this.$set( 'labels', this.keychain[this.id].labels );
            this.$set( 'actionDisabled', 'disabled' );
            this.$set( 'view', 'new' );
            setTimeout( function() {
                document.getElementById( 'new' ).scrollTop = 0;
            }, 0 );
        },
        setFlag: function() {
            if ( this.actionDisabled === 'disabled' ) {
                return;
            }
            var keychain = this.keychain[this.id];
            keychain.flag = !keychain.flag;
            localStorage[this.id] = crypteCode( keychain, this.passphrase );
            Vue.set( this.keychain, this.id, keychain );
        },
        isAppleMobile: function() {
            return /iPhone|iPad/i.test( navigator.userAgent );
        },
        showItems: function( group ) {
            this.$set( 'group', group );
        },
        confirm: function() { },
        remove: function() {
            if ( this.actionDisabled === 'disabled' ) {
                return;
            }
            var scope = this;
            scope.confirm = function() {
                scope.$set( 'view', '' );
                localStorage.removeItem( scope.id );
                Vue.delete( scope.keychain, scope.id );
                scope.$set( 'id', '' );
                scope.$set( 'actionDisabled', 'disabled' );
                scope.$set( 'message', '' );
            };
            scope.$set( 'messagebox', 'confirm' );
            scope.$set( 'message', 'Are you sure you want to remove this account?' );
            setTimeout( function() {
                document.getElementById( 'messageNO' ).focus();
            }, 0 );
        },
        setAvatar: function( avatar ) {
            this.$set( 'currentAvatar', avatar );
        },
        close: function() {
            this.$set( 'view', '' );
            this.$set( 'id', '' );
            this.$set( 'actionDisabled', 'disabled' );
        },
        settings: function() {
            this.$set( 'view', 'settings' );
            this.$set( 'id', '' );
            this.$set( 'actionDisabled', 'disabled' );
        },
        savePassword: function( e ) {
            if ( e && e.keyCode !== 13 ) {
                return;
            }
            if ( getIdentification( this.oldPassword ).toString() !== localStorage.identification ) {
                this.$set( 'messagebox', '' );
                this.$set( 'message', 'Old password and current password don\'t match.' );
                setTimeout( function() {
                    document.getElementById( 'messageOK' ).focus();
                }, 0 );
                return;
            }
            if ( this.newPassword !== this.confirmPassword ) {
                this.$set( 'messagebox', '' );
                this.$set( 'message', 'New password and confirm password don\'t match.' );
                setTimeout( function() {
                    document.getElementById( 'messageOK' ).focus();
                }, 0 );
                return;
            }
            if ( !this.newPassword ) {
                this.$set( 'messagebox', '' );
                this.$set( 'message', 'You must set a master password.' );
                setTimeout( function() {
                    document.getElementById( 'messageOK' ).focus();
                }, 0 );
                return;
            }
            this.$set( 'passphrase', this.newPassword );
            this.setPassphrase();
            this.$set( 'oldPassword', '' );
            this.$set( 'newPassword', '' );
            this.$set( 'confirmPassword', '' );
            this.$set( 'messagebox', '' );
            this.$set( 'message', 'Your master password has been updated.' );
            setTimeout( function() {
                document.getElementById( 'messageOK' ).focus();
            }, 0 );
        },
        closeMessage: function( e ) {
            if ( e && e.keyCode !== 13 ) {
                return;
            }
            this.$set( 'message', '' );
        },
        getKeychainXML: function() {
            var xml = '<?xml version="1.0" encoding="UTF-8"?>';
            xml += '<keychain>';
            xml += '<identification>' + localStorage.identification + '</identification>';
            for ( var id in localStorage ) {
                if ( id !== 'identification' ) {
                    xml += '<item>';
                    xml += '<id>' + id + '</id>';
                    xml += '<value>' + localStorage[id] + '</value>';
                    xml += '</item>';
                }
            }
            xml += '</keychain>';
            return xml;
        },
        exportData: function() {
            var xml = this.getKeychainXML();
            var url = 'data:application/xml;charset=utf-8;base64,' + encodeURI( btoa( xml ) );
            window.open( url, '_blank' );
        },
        importData: function() {
            var scope = this;
            var importFile = document.getElementById( 'import' ).files[0];
            var fileReader = new FileReader();
            if ( !fileReader ) {
                document.getElementById( 'import' ).value = '';
                scope.upgradeBrowser();
                return;
            } else {
                fileReader.onload = function( e ) {
                    scope.readImportXML( e.target.result );
                }
                fileReader.readAsText( importFile );
            }
            document.getElementById( 'import' ).value = '';
        },
        upgradeBrowser: function() {
            this.$set( 'messagebox', '' );
            this.$set( 'message', 'Your browser is too outdated, please upgrade to a modern browser.' );
            setTimeout( function() {
                document.getElementById( 'messageOK' ).focus();
            }, 0 );
        },
        readImportXML: function( xml ) {
            if ( !DOMParser ) {
                this.upgradeBrowser();
                return;
            }
            xml = new DOMParser().parseFromString( xml, 'text/xml' );
            var importIdentification = xml.getElementsByTagName( 'identification' )[0].childNodes[0].nodeValue;
            if ( localStorage.identification && importIdentification !== localStorage.identification ) {
                this.$set( 'messagebox', '' );
                this.$set( 'message', 'Your current master password can not decrypt this keychain.' );
                setTimeout( function() {
                    document.getElementById( 'messageOK' ).focus();
                }, 0 );
                return;
            } else if ( !localStorage.identification ) {
                localStorage.identification = importIdentification;
            }
            var items = xml.getElementsByTagName( 'item' );
            for ( var index = 0, len = items.length; index < len; index++ ) {
                var id = items[index].getElementsByTagName( 'id' )[0].childNodes[0].nodeValue;
                var value = items[index].getElementsByTagName( 'value' )[0].childNodes[0].nodeValue;
                localStorage[id] = value;
                        
            }
            decryptCode( this.passphrase );
            this.$set( 'messagebox', '' );
            this.$set( 'message', 'Import keychain succeed.' );
            setTimeout( function() {
                document.getElementById( 'messageOK' ).focus();
            }, 0 );
        },
        exportImg: function() {
            var scope = this;
            var raw = atob( backupPNG );
            var rawLength = raw.length
            var backup = new Uint8Array( raw.length );
            for ( var i = 0; i < rawLength; i++ ) {
                backup[i] = raw.charCodeAt( i );
            }
            var blob = new Blob( [backup, scope.getKeychainXML()], {type: 'image/png'} );
            var imgReader = new FileReader();
            imgReader.onload = function() {
                scope.confirm = function() {
                    window.open( imgReader.result );
                    scope.$set( 'message', '' );
                }
                scope.$set( 'messagebox', 'confirm' );
                scope.$set( 'message', 'You will see an image, save and import it on another device.' );
            }
            imgReader.readAsDataURL( blob );
        },
        importImg: function() {
            var scope = this;
            var importFile = document.getElementById( 'importImg' ).files[0];
            var fileReader = new FileReader();
            if ( !fileReader ) {
                document.getElementById( 'importImg' ).value = '';
                scope.upgradeBrowser();
                return;
            } else {
                fileReader.onload = function( e ) {
                    var buffer = new Uint8Array( fileReader.result, 400 );
                    scope.readImportXML( String.fromCharCode.apply(null, buffer) );
                }
                fileReader.readAsArrayBuffer( importFile );
            }
            document.getElementById( 'importImg' ).value = '';
        },
    },
    watch: {
        rule: function() {
            if ( this.rule.length === 0 ) {
                this.generateStatus = 'disabled';
            } else {
                this.generateStatus = 'primary';
            }
        },
        title: function() {
            if ( this.title && this.account && this.key && this.key !== 'loading...' ) {
                this.saveStatus = 'save';
            } else {
                this.saveStatus = 'disabled';
            }
        },
        account: function() {
            if ( this.title && this.account && this.key && this.key !== 'loading...' ) {
                this.saveStatus = 'save';
            } else {
                this.saveStatus = 'disabled';
            }
        },
        key: function() {
            if ( this.title && this.account && this.key && this.key !== 'loading...' ) {
                this.saveStatus = 'save';
            } else {
                this.saveStatus = 'disabled';
            }
        },
    },
});

Vue.filter( 'searchItem', function ( items, keyword ) {
    var newItems = {};
    keyword = keyword ? keyword.toLowerCase() : null;

    for ( var id in items ) {
        if ( !keyword || items[id].title.toLowerCase().indexOf( keyword ) > -1 || items[id].account.toLowerCase().indexOf( keyword ) > -1 ) {
            if ( app.group === 'flag' && items[id].flag || app.group !== 'all' && items[id].labels.indexOf( app.group ) > -1 || app.group === 'all' ) {
                newItems[id] = items[id];
            }
        }
    }

    return newItems;
} );

var keyQuery = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`~!@#$%^&*()-_=+[{]}\\|;:\'",<.>/?';
keyQuery = keyQuery.split('');

var randomAPI = 'https://www.random.org/integers/?num=%s&min=0&max=100&col=%s&base=16&format=plain&rnd=new';

var keyRule = {
    digit: [0, 10],
    lower_alpha: [10, 26],
    upper_alpah: [36, 26],
    symbol: [62, 32],
};

function getTime() {
    var date = new Date();
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return month[monthIndex] + ' ' + day + ', ' + year + ' at ' + hour % 12 + ':' + (minute < 10 ? '0' : '') + minute + ' ' + (hour < 12 ? 'AM' : 'PM');
}

function decryptCode( passphrase ) {
    var keychain = {};
    for ( var id in localStorage ) {
        if ( id !== 'identification' ) {
            var decryptedCode = CryptoJS.AES.decrypt( localStorage[id], passphrase ).toString( CryptoJS.enc.Utf8 );
            keychain[id] = JSON.parse( decryptedCode );
        }
    }
    app.$set( 'keychain', keychain );
}

function getIdentification( passphrase ) {
    for ( var i = 0; i < 20; i++ ) {
        passphrase = CryptoJS.MD5( passphrase );
    }
    return passphrase;
}

function crypteCode( jsonCode, passphrase ) {
    var cryptedCode = CryptoJS.AES.encrypt( JSON.stringify( jsonCode ), passphrase ).toString();
    try {
        var decryptedCode = CryptoJS.AES.decrypt( cryptedCode, passphrase ).toString( CryptoJS.enc.Utf8 );
        try {
            JSON.parse( decryptedCode );
            return cryptedCode;
        } catch ( e ) {
            crypteCode( jsonCode );
        }
    } catch( e ) {
        crypteCode( jsonCode );
    }
}

function getSubKeyQuery( newPassRule ) {
    var newKeyQuery = [];

    if ( newPassRule.indexOf( 'digit' ) > -1 ) {
        newKeyQuery = newKeyQuery.concat( keyQuery.slice( keyRule.digit[0], keyRule.digit[0] + keyRule.digit[1] ) );
    }

    if ( newPassRule.indexOf( 'lower_alpha' ) > -1 ) {
        newKeyQuery = newKeyQuery.concat( keyQuery.slice( keyRule.lower_alpha[0], keyRule.lower_alpha[0] + keyRule.lower_alpha[1] ) );
    }

    if ( newPassRule.indexOf( 'upper_alpha' ) > -1 ) {
        newKeyQuery = newKeyQuery.concat( keyQuery.slice( keyRule.upper_alpah[0], keyRule.upper_alpah[0] + keyRule.upper_alpah[1] ) );
    }

    if ( newPassRule.indexOf( 'symbol' ) > -1 ) {
        newKeyQuery = newKeyQuery.concat( keyQuery.slice( keyRule.symbol[0], keyRule.symbol[0] + keyRule.symbol[1] ) );
    }

    return newKeyQuery;
}

function hex2key( hex, newKeyQuery ) {
    var index, ordinal, key = '', len = hex.length, queryLen = newKeyQuery.length;

    for ( index = 0; index < len; index++ ) {
        ordinal = parseInt( hex[index], 16 ) % queryLen;
        key += newKeyQuery[ordinal];
    }

    return key;
}

function loadXMLDoc( url, callback, fail ) {
    var xmlhttp;
    if ( window.XMLHttpRequest ) {
        xmlhttp = new XMLHttpRequest();
    } else {
        fail();
    }
    xmlhttp.onreadystatechange = function() {
        if ( xmlhttp.readyState === 4 ) {
            if ( xmlhttp.status === 200 ) {
                callback( xmlhttp.responseText )
            } else {
                fail();
            }
        }
    };
    xmlhttp.open( 'GET', url, true );
    xmlhttp.send();
}

function getRandomKey( len, newPassRule, callback ) {
    var newKeyQuery = getSubKeyQuery( newPassRule );
    getRandomKeyOnline( len, newKeyQuery, callback );
}

function getRandomKeyOnline( len, newKeyQuery, callback ) {
    var apiURL = randomAPI.replace( /%s/g, len );
    loadXMLDoc( apiURL, function( hexRaw ) {
        var hex = hexRaw.split('\t');
        var key = hex2key( hex, newKeyQuery );
        callback( key );
    }, function() {
        getRandomKeyLocal( len, newKeyQuery, callback );
    } );
}

function getRandomKeyLocal( len, newKeyQuery, callback ) {
    var index, hex = [];
    for ( index = 0; index < len; index++ ) {
        hex.push( Math.floor( Math.random() * 100 ).toString( 16 ) );
    }
    var key = hex2key( hex, newKeyQuery );
    callback( key );
}

function generate() {
    getRandomKey( app.length, app.rule, function( key ) {
        app.key = key;
    });
}

setTimeout( function() {
    document.getElementById( 'passphrase' ).focus();
}, 0 );

})();