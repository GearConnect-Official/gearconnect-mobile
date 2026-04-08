import React from "react";
import { TextInput, TextInputProps } from "react-native";

const CustomTextInput = (props: TextInputProps) => {
    return (
        <TextInput
        textContentType="none"
        cursorColor="#E10600" 
        selectionColor="#E10600"  
        autoComplete="off"  
        {...props}
        />
    );                                        
};

export default CustomTextInput;