// Modal History Manager - Handle back button for modals
(function() {
    'use strict';
    
    let modalStack = [];
    let historyInitialized = false;
    
    // Initialize history listener
    function initHistoryListener() {
        if (historyInitialized) return;
        
        window.addEventListener('popstate', function(e) {
            if (modalStack.length > 0) {
                e.preventDefault();
                const modalInfo = modalStack.pop();
                if (modalInfo && modalInfo.closeFunction) {
                    modalInfo.closeFunction();
                }
            }
        });
        
        historyInitialized = true;
    }
    
    // Open modal with history support
    window.openModalWithHistory = function(modalElement, closeFunction) {
        initHistoryListener();
        
        // Add to history
        history.pushState({ modal: true }, '');
        
        // Add to stack
        modalStack.push({
            element: modalElement,
            closeFunction: closeFunction
        });
        
        console.log('Modal opened with history support');
    };
    
    // Close modal and remove from history
    window.closeModalWithHistory = function() {
        if (modalStack.length > 0) {
            modalStack.pop();
            
            // Go back in history if we added a state
            if (window.history.state && window.history.state.modal) {
                history.back();
            }
        }
    };
    
    // Clear all modals from stack
    window.clearModalHistory = function() {
        modalStack = [];
    };
    
})();
