//
function Validator(options) {

    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement
            }
            element = element.parentElement
        }
    }

    var selectorRules = {}

    function Validate (inputElement, rule) {
        var errorMessage
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)

        //Lấy ra các rules của selector
        var rules = selectorRules[rule.selector]
        //Lặp qua từng rule và kiểm tra
        //Nếu có lỗi thì dừng việc kiểm tra
        for (var i = 0; i < rules.length; i++){
            switch (inputElement.type){
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    )
                    break

                default: 
                    errorMessage = rules[i](inputElement.value)
                    break
            }
            if (errorMessage) break
        }

        if (errorMessage) {
            errorElement.innerText = errorMessage
            getParent(inputElement, options.formGroupSelector).classList.add('invalid')
        } else {
            errorElement.innerText = ''
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
        }

        return !errorMessage
    }

    var formElement = document.querySelector(options.form)
    if (formElement) {
        //Khi submit form
        formElement.onsubmit = function (e) {
            var isFormValid = true;

            e.preventDefault()
            options.rules.forEach(function (rule) {
                var inputElements = formElement.querySelectorAll(rule.selector)
                Array.from(inputElements).forEach(function (inputElement) {
                    var isValid = Validate(inputElement, rule)
                    if (!isValid) {
                        isFormValid = false
                }
                })
            })

            if (isFormValid) {
                // Trường hợp submit với javascript
                if (typeof options.onSubmit === 'function'){
                    var enableInputs = formElement.querySelectorAll('[name]')
                    var formValue = Array.from(enableInputs).reduce(function (values, input) {
                        switch (input.type){
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value
                                break

                            case 'checkbox':
                                if(!input.matches(':checked')) {
                                    values[input.name] = ""
                                    return values
                                }
                                if(!Array.isArray(values[input.name])){
                                    values[input.name] = []
                                }
                                values[input.name].push(input.value)
                                break
  
                            case 'file':
                                values.input.name = input.files
                                break

                            default:
                                values[input.name] = input.value
                        }
                        return values 
                    } , {})
                    options.onSubmit(formValue)
                }
                else{
                    formElement.submit()
                }
            } 
            // Trường hợp submit với hành vi mặc định
            
        }

        // Lặp qua mỗi rule và xử lý (lắng nghe sự kiện blur, input, ...)
        options.rules.forEach(function (rule) {
            //Lưu lại các rule cho mỗi input
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test)
            } else {
                selectorRules[rule.selector] = [rule.test]
            }


            var inputElements = formElement.querySelectorAll(rule.selector)

            Array.from(inputElements).forEach(function(inputElement){
                if (inputElement) {
                //Handle blur event
                inputElement.onblur = function () {
                    Validate(inputElement, rule)    
                }

                //Handle input event
                inputElement.oninput = function () {
                    var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
                    errorElement.innerText = ''
                    getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
                }
            }
            })
        });

    }
}

//Define rules
Validator.isRequired = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            return value ? undefined : message || 'Vui lòng nhập trường này'
        }
    }
}

Validator.isEmail = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            var regex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
            return regex.test(value) ? undefined : message || 'Trường này phải là email'
        }
    }
}

Validator.minLength = function (selector, min, message) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min ? undefined : message || `Vui lòng nhập tối thiểu ${min} ký tự`
        }
    }
}

Validator.isConfirmed = function (selector, getConfirmValue, message) {
    return {
        selector: selector,
        test: function (value) {
            return value === getConfirmValue() ? undefined : message || 'Giá trị lập lại không chính xác'
        }
    }
}